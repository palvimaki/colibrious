export interface ImageTransformations {
  width?: number;
  height?: number;
  rotation: number;
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
  currentTransformations: ImageTransformations;
  isProcessing: boolean;
  processedUrl?: string;
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
