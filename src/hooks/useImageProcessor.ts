import { useCallback, useState } from 'react';
import { DEFAULT_TRANSFORMATIONS, toPipelineOps } from '../types/image';
import type { ProcessedImage, ImageTransformations } from '../types/image';
import { decodeImage, runPipeline } from '../utils/pipeline';
import { createZip } from '../utils/zip';
import type { ZipEntry } from '../utils/zip';
import { saveAs } from 'file-saver';
import { useStrings } from '../i18n/useStrings';

const ACCEPTED_TYPES: ReadonlyArray<ImageTransformations['format']> = [
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per file
const MAX_PIXELS = 50_000_000; // 50 MP decoded — guards against tab OOM on giant images

export interface FileError {
  file: string;
  reason: string;
}

const formatFromMime = (mime: string): ImageTransformations['format'] => {
  if (mime === 'image/jpeg') return 'image/jpeg';
  if (mime === 'image/webp') return 'image/webp';
  return 'image/png';
};

const loadDimensions = (url: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('decode'));
    img.src = url;
  });

export const useImageProcessor = () => {
  const t = useStrings();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [errors, setErrors] = useState<FileError[]>([]);
  const [isBuildingPdf, setIsBuildingPdf] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const pushError = useCallback((entry: FileError) => {
    setErrors((prev) => [...prev, entry]);
    window.setTimeout(() => {
      setErrors((prev) => prev.filter((e) => e !== entry));
    }, 8000);
  }, []);

  const clearErrors = useCallback(() => setErrors([]), []);

  const addFiles = useCallback(
    async (files: File[]) => {
      const accepted: ProcessedImage[] = [];

      for (const file of files) {
        if (!ACCEPTED_TYPES.includes(file.type as ImageTransformations['format'])) {
          pushError({
            file: file.name,
            reason: t.unsupportedFileType,
          });
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          pushError({
            file: file.name,
            reason: t.fileTooLarge((file.size / 1024 / 1024).toFixed(1)),
          });
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        try {
          const dimensions = await loadDimensions(previewUrl);
          const pixels = dimensions.width * dimensions.height;
          if (pixels > MAX_PIXELS) {
            URL.revokeObjectURL(previewUrl);
            pushError({
              file: file.name,
              reason: t.tooManyPixels((pixels / 1_000_000).toFixed(0)),
            });
            continue;
          }
          accepted.push({
            id: Math.random().toString(36).slice(2, 11),
            originalFile: file,
            previewUrl,
            originalWidth: dimensions.width,
            originalHeight: dimensions.height,
            currentTransformations: {
              ...DEFAULT_TRANSFORMATIONS,
              format: formatFromMime(file.type),
            },
            isProcessing: false,
          });
        } catch {
          URL.revokeObjectURL(previewUrl);
          pushError({ file: file.name, reason: t.decodeFailed });
        }
      }

      if (accepted.length > 0) {
        setImages((prev) => [...prev, ...accepted]);
      }
    },
    [pushError, t]
  );

  const updateTransformations = useCallback(
    (id: string, transformations: Partial<ImageTransformations>) => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { ...img, currentTransformations: { ...img.currentTransformations, ...transformations } }
            : img
        )
      );
    },
    []
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const imgToRemove = prev.find((img) => img.id === id);
      if (imgToRemove) {
        URL.revokeObjectURL(imgToRemove.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  /** Decode + run the pipeline for one image, surfacing errors. Returns the
   *  actual encoded format so callers can name files correctly (WebP→PNG etc.). */
  const getOutputBlob = useCallback(
    async (img: ProcessedImage): Promise<{ blob: Blob; extension: string } | null> => {
      try {
        const source = await decodeImage(img.originalFile);
        let result: Awaited<ReturnType<typeof runPipeline>>;
        try {
          result = await runPipeline(source, toPipelineOps(img.currentTransformations));
        } finally {
          source.close();
        }
        return { blob: result.blob, extension: result.format.split('/')[1] };
      } catch (error) {
        pushError({
          file: img.originalFile.name,
          reason: error instanceof Error ? error.message : t.processingFailed,
        });
        return null;
      }
    },
    [pushError, t]
  );

  const downloadImage = useCallback(
    async (id: string) => {
      const img = images.find((i) => i.id === id);
      if (!img) return;

      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, isProcessing: true } : i)));
      const out = await getOutputBlob(img);
      if (out) {
        const base = img.originalFile.name.replace(/\.[^/.]+$/, '');
        saveAs(out.blob, `${base}-${t.downloadSuffix}.${out.extension}`);
      }
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, isProcessing: false } : i)));
    },
    [images, getOutputBlob, t]
  );

  /** Download every image as a single .zip. One saveAs — no browser multi-download blocking. */
  const downloadAll = useCallback(async () => {
    if (images.length === 0 || isDownloadingAll) return;
    setIsDownloadingAll(true);
    try {
      const entries: ZipEntry[] = [];
      const taken = new Set<string>();
      for (const img of images) {
        const out = await getOutputBlob(img);
        if (!out) continue; // error already pushed
        const base = `${img.originalFile.name.replace(/\.[^/.]+$/, '')}-${t.downloadSuffix}`;
        const dotExt = `.${out.extension}`;
        let name = `${base}${dotExt}`;
        if (taken.has(name)) {
          let n = 1;
          while (taken.has(`${base} (${n})${dotExt}`)) n += 1;
          name = `${base} (${n})${dotExt}`;
        }
        taken.add(name);
        entries.push({ name, data: new Uint8Array(await out.blob.arrayBuffer()) });
      }
      if (entries.length === 0) return;
      const zip = createZip(entries);
      saveAs(zip, t.zipFilename(entries.length));
    } catch (error) {
      pushError({
        file: 'ZIP',
        reason: error instanceof Error ? error.message : t.zipBuildFailed,
      });
    } finally {
      setIsDownloadingAll(false);
    }
  }, [images, isDownloadingAll, getOutputBlob, pushError, t]);

  const downloadAllAsPdf = useCallback(async () => {
    if (images.length === 0 || isBuildingPdf) return;
    setIsBuildingPdf(true);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();

      for (const img of images) {
        try {
          const source = await decodeImage(img.originalFile);
          let result: Awaited<ReturnType<typeof runPipeline>>;
          try {
            // PDF pages are always JPEG-embedded regardless of the user's chosen
            // format — size-optimal, and pdf-lib embeds JPG cheaply.
            const ops = toPipelineOps(img.currentTransformations);
            result = await runPipeline(source, {
              ...ops,
              format: 'image/jpeg',
              quality: img.currentTransformations.quality || 0.92,
            });
          } finally {
            source.close();
          }
          const bytes = new Uint8Array(await result.blob.arrayBuffer());
          const embedded = await pdf.embedJpg(bytes);

          // Uniform A4 pages, orientation chosen per image, fit-and-center.
          const A4_SHORT = 595.28;
          const A4_LONG = 841.89;
          const MARGIN = 12;
          const isLandscape = embedded.width >= embedded.height;
          const pageW = isLandscape ? A4_LONG : A4_SHORT;
          const pageH = isLandscape ? A4_SHORT : A4_LONG;
          const scale = Math.min(
            (pageW - MARGIN * 2) / embedded.width,
            (pageH - MARGIN * 2) / embedded.height
          );
          const drawW = embedded.width * scale;
          const drawH = embedded.height * scale;
          const page = pdf.addPage([pageW, pageH]);
          page.drawImage(embedded, {
            x: (pageW - drawW) / 2,
            y: (pageH - drawH) / 2,
            width: drawW,
            height: drawH,
          });
        } catch (error) {
          pushError({
            file: img.originalFile.name,
            reason: error instanceof Error ? error.message : t.pdfPageFailed,
          });
        }
      }

      if (pdf.getPageCount() === 0) return;
      const pdfBytes = await pdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      saveAs(blob, t.pdfFilename(pdf.getPageCount()));
    } catch (error) {
      pushError({
        file: 'PDF',
        reason: error instanceof Error ? error.message : t.pdfBuildFailed,
      });
    } finally {
      setIsBuildingPdf(false);
    }
  }, [images, isBuildingPdf, pushError, t]);

  const clearImages = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
  }, [images]);

  return {
    images,
    errors,
    isBuildingPdf,
    isDownloadingAll,
    clearErrors,
    addFiles,
    updateTransformations,
    removeImage,
    downloadImage,
    downloadAll,
    downloadAllAsPdf,
    clearImages,
  };
};
