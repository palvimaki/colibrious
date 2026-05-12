import type { ImageTransformations } from '../types/image';
import { runPipeline } from './pipeline';

export const processImageOnCanvas = async (
  imageSource: HTMLImageElement,
  transformations: ImageTransformations
): Promise<Blob> => {
  const source = await createImageBitmap(imageSource);
  const result = await runPipeline(source, {
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
  source.close();
  return result.blob;
};

export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};
