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

  const clearImages = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
  }, [images]);

  return {
    images,
    errors,
    clearErrors,
    addFiles,
    updateTransformations,
    removeImage,
    processImage,
    downloadImage,
    clearImages,
  };
};
