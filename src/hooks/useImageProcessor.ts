import { useState, useCallback } from 'react';
import { DEFAULT_TRANSFORMATIONS } from '../types/image';
import type { ProcessedImage, ImageTransformations } from '../types/image';
import { processImageOnCanvas, loadImage } from '../utils/canvasHelper';
import { saveAs } from 'file-saver';

export const useImageProcessor = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);

  const addFiles = useCallback((files: File[]) => {
    const newImages: ProcessedImage[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      originalFile: file,
      previewUrl: URL.createObjectURL(file),
      currentTransformations: { ...DEFAULT_TRANSFORMATIONS },
      isProcessing: false,
    }));
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
        if (imgToRemove.processedUrl) URL.revokeObjectURL(imgToRemove.processedUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  }, []);

  const processImage = useCallback(async (id: string) => {
    const img = images.find((i) => i.id === id);
    if (!img) return;

    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, isProcessing: true } : i)));

    try {
      const source = await loadImage(img.previewUrl);
      const blob = await processImageOnCanvas(source, img.currentTransformations);
      const processedUrl = URL.createObjectURL(blob);

      setImages((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, isProcessing: false, processedUrl }
            : i
        )
      );
      return blob;
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
      if (img.processedUrl) URL.revokeObjectURL(img.processedUrl);
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
