import { useCallback, useState } from 'react';
import { DEFAULT_TRANSFORMATIONS } from '../types/image';
import type { ProcessedImage, ImageTransformations } from '../types/image';
import { decodeImage, runPipeline } from '../utils/pipeline';
import { saveAs } from 'file-saver';

const ACCEPTED_TYPES: ReadonlyArray<ImageTransformations['format']> = [
  'image/png',
  'image/jpeg',
  'image/webp',
];

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per file

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

const toPipelineOps = (transformations: ImageTransformations) => ({
  crop: transformations.crop,
  resize:
    transformations.width && transformations.height
      ? { w: transformations.width, h: transformations.height }
      : undefined,
  rotation: transformations.rotation,
  flipH: transformations.flipHorizontal,
  flipV: transformations.flipVertical,
  brightness: transformations.brightness,
  contrast: transformations.contrast,
  grayscale: transformations.grayscale,
  sepia: transformations.sepia,
  format: transformations.format,
  quality: transformations.quality,
  watermarkText: transformations.watermarkText,
  watermarkOpacity: transformations.watermarkOpacity,
});

export const useImageProcessor = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [errors, setErrors] = useState<FileError[]>([]);
  const [isBuildingPdf, setIsBuildingPdf] = useState(false);

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
            reason: 'Tukematon tiedostomuoto. Hyväksytyt: PNG, JPEG, WebP.',
          });
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          pushError({
            file: file.name,
            reason: `Tiedosto on liian suuri (${(file.size / 1024 / 1024).toFixed(1)} MB). Yläraja 50 MB.`,
          });
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        try {
          const dimensions = await loadDimensions(previewUrl);
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
          pushError({ file: file.name, reason: 'Kuvan dekoodaus epäonnistui.' });
        }
      }

      if (accepted.length > 0) {
        setImages((prev) => [...prev, ...accepted]);
      }
    },
    [pushError]
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

  const processImage = useCallback(
    async (id: string) => {
      const img = images.find((i) => i.id === id);
      if (!img) return;

      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, isProcessing: true } : i)));

      try {
        const source = await decodeImage(img.originalFile);
        let result: Awaited<ReturnType<typeof runPipeline>>;
        try {
          result = await runPipeline(source, toPipelineOps(img.currentTransformations));
        } finally {
          source.close();
        }

        setImages((prev) => prev.map((i) => (i.id === id ? { ...i, isProcessing: false } : i)));
        return result.blob;
      } catch (error) {
        setImages((prev) => prev.map((i) => (i.id === id ? { ...i, isProcessing: false } : i)));
        pushError({
          file: img.originalFile.name,
          reason: error instanceof Error ? error.message : 'Käsittely epäonnistui.',
        });
      }
    },
    [images, pushError]
  );

  const downloadImage = useCallback(
    async (id: string) => {
      const img = images.find((i) => i.id === id);
      if (!img) return;

      const blob = await processImage(id);
      if (blob) {
        const extension = img.currentTransformations.format.split('/')[1];
        const fileName =
          img.originalFile.name.replace(/\.[^/.]+$/, '') + `-kuvankasittely.${extension}`;
        saveAs(blob, fileName);
      }
    },
    [images, processImage]
  );

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
            reason: error instanceof Error ? error.message : 'PDF-sivun lisääminen epäonnistui.',
          });
        }
      }

      if (pdf.getPageCount() === 0) return;
      const pdfBytes = await pdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      saveAs(blob, `kuvankasittely-${pdf.getPageCount()}-kuvaa.pdf`);
    } catch (error) {
      pushError({
        file: 'PDF',
        reason: error instanceof Error ? error.message : 'PDF:n luonti epäonnistui.',
      });
    } finally {
      setIsBuildingPdf(false);
    }
  }, [images, isBuildingPdf, pushError]);

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
    clearErrors,
    addFiles,
    updateTransformations,
    removeImage,
    processImage,
    downloadImage,
    downloadAllAsPdf,
    clearImages,
  };
};
