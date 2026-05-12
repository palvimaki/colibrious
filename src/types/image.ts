import type { CropRect, Rotation } from '../utils/pipeline';

export interface ImageTransformations {
  width?: number;
  height?: number;
  crop?: CropRect;
  rotation: Rotation;
  flipHorizontal: boolean;
  flipVertical: boolean;
  brightness: number;
  contrast: number;
  grayscale: boolean;
  sepia: boolean;
  blur: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  quality: number;
  stripMetadata: boolean;
  watermarkText?: string;
  watermarkOpacity: number;
}

export interface ProcessedImage {
  id: string;
  originalFile: File;
  previewUrl: string;
  originalWidth: number;
  originalHeight: number;
  currentTransformations: ImageTransformations;
  isProcessing: boolean;
}

export const DEFAULT_TRANSFORMATIONS: ImageTransformations = {
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  brightness: 100,
  contrast: 100,
  grayscale: false,
  sepia: false,
  blur: 0,
  format: 'image/png',
  quality: 0.92,
  stripMetadata: true,
  watermarkOpacity: 0.5,
};
