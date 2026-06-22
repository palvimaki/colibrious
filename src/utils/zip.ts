/**
 * Minimal, dependency-free ZIP writer (STORE method — no compression).
 *
 * "Download all" must hand the browser a single blob: firing one `saveAs` per
 * image after async decode runs outside the user-gesture window, so browsers
 * block the 2nd+ download. Zipping sidesteps that.
 *
 * The inputs here are already-compressed image bytes (PNG/JPEG/WebP), so
 * STORE (no recompression) keeps the archive within ~a few dozen bytes per
 * entry of the raw total — there is nothing for DEFLATE to gain. This keeps
 * the writer tiny and dependency-free while producing a standard .zip that
 * every OS can open.
 *
 * Classic ZIP only (no ZIP64): entry count, sizes, and offsets must each fit
 * in 16/32-bit fields. `u16`/`u32` THROW on overflow rather than silently
 * wrapping, so an out-of-range batch raises a user-visible error instead of
 * producing a saved-but-corrupt archive.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

const crc32 = (data: Uint8Array): number => {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
};

/** DOS date/time fields for the ZIP timestamp slots. */
const dosDateTime = (d: Date) => ({
  time:
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    ((d.getSeconds() >> 1) & 0x1f),
  date:
    (((d.getFullYear() - 1980) & 0x7f) << 9) |
    (((d.getMonth() + 1) & 0x0f) << 5) |
    (d.getDate() & 0x1f),
});

export interface ZipEntry {
  name: string;
  data: Uint8Array<ArrayBuffer>;
}

/** Throws on overflow so a too-big archive fails loudly instead of corrupting. */
const u16 = (v: number): Uint8Array<ArrayBuffer> => {
  if (!Number.isInteger(v) || v < 0 || v > 0xffff) {
    throw new Error(`ZIP 16-bit field out of range: ${v}`);
  }
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, v, true);
  return b;
};

/** Throws on overflow so a too-big archive fails loudly instead of corrupting. */
const u32 = (v: number): Uint8Array<ArrayBuffer> => {
  if (!Number.isInteger(v) || v < 0 || v > 0xffffffff) {
    throw new Error(`ZIP 32-bit field out of range: ${v}`);
  }
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, v, true);
  return b;
};

export const createZip = (entries: ZipEntry[]): Blob => {
  if (entries.length > 0xffff) {
    throw new Error('Too many files to zip (limit 65,535).');
  }

  const chunks: BlobPart[] = [];
  const enc = new TextEncoder();
  const { time, date } = dosDateTime(new Date());
  let offset = 0;

  // Each piece is pushed as its own BlobPart — entry bytes are referenced,
  // never copied, so peak memory stays ~the sum of the inputs.
  const emit = (bytes: Uint8Array<ArrayBuffer>) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  const central: {
    offset: number;
    nameBytes: Uint8Array<ArrayBuffer>;
    crc: number;
    size: number;
    flags: number;
  }[] = [];

  for (const entry of entries) {
    const nameBytes = new Uint8Array(enc.encode(entry.name));
    // Set the UTF-8 language-encoding flag (bit 11) when the name has
    // non-ASCII bytes — required so Finnish/unicode filenames extract correctly.
    const flags = nameBytes.some((b) => b >= 0x80) ? 0x0800 : 0x0000;
    const crc = crc32(entry.data);
    const size = entry.data.length;
    const localHeaderOffset = offset;
    central.push({ offset: localHeaderOffset, nameBytes, crc, size, flags });

    // Local file header (signature 0x04034b50).
    emit(Uint8Array.of(0x50, 0x4b, 0x03, 0x04));
    emit(u16(20)); // version needed to extract (2.0)
    emit(u16(flags)); // general purpose bit flag
    emit(u16(0)); // compression method: 0 = stored
    emit(u16(time));
    emit(u16(date));
    emit(u32(crc));
    emit(u32(size)); // compressed size
    emit(u32(size)); // uncompressed size
    emit(u16(nameBytes.length));
    emit(u16(0)); // extra field length
    emit(nameBytes);
    emit(entry.data);
  }

  const centralOffset = offset;
  for (const c of central) {
    // Central directory file header (signature 0x02014b50).
    emit(Uint8Array.of(0x50, 0x4b, 0x01, 0x02));
    emit(u16(20)); // version made by
    emit(u16(20)); // version needed to extract
    emit(u16(c.flags)); // general purpose bit flag
    emit(u16(0)); // compression method: 0 = stored
    emit(u16(time));
    emit(u16(date));
    emit(u32(c.crc));
    emit(u32(c.size)); // compressed size
    emit(u32(c.size)); // uncompressed size
    emit(u16(c.nameBytes.length));
    emit(u16(0)); // extra field length
    emit(u16(0)); // file comment length
    emit(u16(0)); // disk number start
    emit(u16(0)); // internal file attributes
    emit(u32(0)); // external file attributes
    emit(u32(c.offset)); // relative offset of local header
    emit(c.nameBytes);
  }
  const centralSize = offset - centralOffset;

  // End of central directory record (signature 0x06054b50).
  emit(Uint8Array.of(0x50, 0x4b, 0x05, 0x06));
  emit(u16(0)); // number of this disk
  emit(u16(0)); // disk where central directory starts
  emit(u16(entries.length)); // central directory records on this disk
  emit(u16(entries.length)); // total central directory records
  emit(u32(centralSize)); // size of central directory
  emit(u32(centralOffset)); // offset of start of central directory
  emit(u16(0)); // comment length

  return new Blob(chunks, { type: 'application/zip' });
};
