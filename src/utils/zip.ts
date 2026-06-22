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
 * No ZIP64: this targets the app's real input range (≤ ~50 MB × a moderate
 * image count). Total size and offsets must stay under 4 GiB.
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
  data: Uint8Array;
}

export const createZip = (entries: ZipEntry[]): Blob => {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const enc = new TextEncoder();
  const { time, date } = dosDateTime(new Date());

  const emit = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };
  const u16 = (v: number) => {
    const b = new Uint8Array(2);
    new DataView(b.buffer).setUint16(0, v & 0xffff, true);
    return b;
  };
  const u32 = (v: number) => {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, v >>> 0, true);
    return b;
  };
  const concat = (parts: Uint8Array[]) => {
    let len = 0;
    for (const p of parts) len += p.length;
    const out = new Uint8Array(len);
    let i = 0;
    for (const p of parts) {
      out.set(p, i);
      i += p.length;
    }
    return out;
  };

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name);
    // Set the UTF-8 language-encoding flag (bit 11) when the name has
    // non-ASCII bytes — required so Finnish/unicode filenames extract correctly.
    const flags = nameBytes.some((b) => b >= 0x80) ? 0x0800 : 0x0000;
    const crc = crc32(entry.data);
    const size = entry.data.length;
    const localHeaderOffset = offset;

    // Local file header (signature 0x04034b50).
    emit(
      concat([
        Uint8Array.of(0x50, 0x4b, 0x03, 0x04),
        u16(20), // version needed to extract (2.0)
        u16(flags), // general purpose bit flag
        u16(0), // compression method: 0 = stored
        u16(time),
        u16(date),
        u32(crc),
        u32(size), // compressed size
        u32(size), // uncompressed size
        u16(nameBytes.length),
        u16(0), // extra field length
        nameBytes,
        entry.data,
      ])
    );

    // Central directory file header (signature 0x02014b50).
    central.push(
      concat([
        Uint8Array.of(0x50, 0x4b, 0x01, 0x02),
        u16(20), // version made by
        u16(20), // version needed to extract
        u16(flags), // general purpose bit flag
        u16(0), // compression method: 0 = stored
        u16(time),
        u16(date),
        u32(crc),
        u32(size), // compressed size
        u32(size), // uncompressed size
        u16(nameBytes.length),
        u16(0), // extra field length
        u16(0), // file comment length
        u16(0), // disk number start
        u16(0), // internal file attributes
        u32(0), // external file attributes
        u32(localHeaderOffset), // relative offset of local header
        nameBytes,
      ])
    );
  }

  const centralBytes = concat(central);
  const centralOffset = offset;
  emit(centralBytes);

  // End of central directory record (signature 0x06054b50).
  emit(
    concat([
      Uint8Array.of(0x50, 0x4b, 0x05, 0x06),
      u16(0), // number of this disk
      u16(0), // disk where central directory starts
      u16(entries.length), // central directory records on this disk
      u16(entries.length), // total central directory records
      u32(centralBytes.length), // size of central directory
      u32(centralOffset), // offset of start of central directory
      u16(0), // comment length
    ])
  );

  return new Blob([concat(chunks)], { type: 'application/zip' });
};
