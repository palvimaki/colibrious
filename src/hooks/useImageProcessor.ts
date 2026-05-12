import { useState, useCallback } from 'react';
import { DEFAULT_TRANSFORMATIONS } from '../types/image';
import type { ProcessedImage, ImageTransformations } from '../types/image';
import { decodeImage, runPipeline } from '../utils/pipeline';
import { saveAs } from 'file-saver';

const loadDimensions = (url: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
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

  const addFiles = useCallback(async (files: File[]) => {
    const results = await Promise.allSettled(
      files.map(async (file) => {
        const previewUrl = URL.createObjectURL(file);
        try {
          const dimensions = await loadDimensions(previewUrl);

          return {
            id: Math.random().toString(36).slice(2, 11),
            originalFile: file,
            previewUrl,
            originalWidth: dimensions.width,
            originalHeight: dimensions.height,
            currentTransformations: { ...DEFAULT_TRANSFORMATIONS },
            isProcessing: false,
          };
        } catch {
          URL.revokeObjectURL(previewUrl);
          throw new Error(file.name);
        }
      })
    );
    const newImages = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
    const failedNames = results.flatMap((result, index) => (result.status === 'rejected' ? [files[index].name] : []));

    if (failedNames.length > 0) {
      console.warn('Failed to add image files:', failedNames);
    }

    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const updateTransformations = useCallback((id: string, transformations: Partial<ImageTransformations>) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id
          ? { ...img, currentTransformations: { ...img.currentTransformations, ...transformations } }
          : img
      )
    );
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const imgToRemove = prev.find((img) => img.id === id);
      if (imgToRemove) {
        URL.revokeObjectURL(imgToRemove.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const processImage = useCallback(async (id: string) => {
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

      setImages((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, isProcessing: false }
            : i
        )
      );
      return result.blob;
    } catch (error) {
      console.error('Processing failed:', error);
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, isProcessing: false } : i)));
    }
  }, [images]);

  const downloadImage = useCallback(async (id: string) => {
    const img = images.find((i) => i.id === id);
    if (!img) return;

    const blob = await processImage(id);
    if (blob) {
      const extension = img.currentTransformations.format.split('/')[1];
      const fileName = img.originalFile.name.replace(/\.[^/.]+$/, "") + `-pixelpaws.${extension}`;
      saveAs(blob, fileName);
    }
  }, [images, processImage]);

  const clearImages = useCallback(() => {
    images.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
  }, [images]);

  return {
    images,
    addFiles,
    updateTransformations,
    removeImage,
    processImage,
    downloadImage,
    clearImages,
  };
};
