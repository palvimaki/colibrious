import type { ImageTransformations } from '../types/image';

export const processImageOnCanvas = async (
  imageSource: HTMLImageElement,
  transformations: ImageTransformations
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const {
    width,
    height,
    rotation,
    flipHorizontal,
    flipVertical,
    brightness,
    contrast,
    grayscale,
    sepia,
    blur,
    format,
    quality,
  } = transformations;

  // Calculate target dimensions
  const targetWidth = width || imageSource.naturalWidth;
  const targetHeight = height || imageSource.naturalHeight;

  // Handle rotation dimensions
  const isRotated90 = (rotation / 90) % 2 !== 0;
  canvas.width = isRotated90 ? targetHeight : targetWidth;
  canvas.height = isRotated90 ? targetWidth : targetHeight;

  // Apply transformations
  ctx.save();
  
  // Move to center for rotation/flip
  ctx.translate(canvas.width / 2, canvas.height / 2);
  
  // Rotation
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Flip
  const scaleX = flipHorizontal ? -1 : 1;
  const scaleY = flipVertical ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Apply filters
  const filters = [
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    grayscale ? 'grayscale(100%)' : '',
    sepia ? 'sepia(100%)' : '',
    blur > 0 ? `blur(${blur}px)` : '',
  ].filter(Boolean).join(' ');

  if (filters) {
    ctx.filter = filters;
  }

  // Draw image
  ctx.drawImage(
    imageSource,
    -targetWidth / 2,
    -targetHeight / 2,
    targetWidth,
    targetHeight
  );

  // Apply Watermark
  if (transformations.watermarkText) {
    ctx.restore(); // Get clean state for watermark placement if needed, but we can just use the current translation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2); // Re-center if we restored
    
    const fontSize = Math.max(20, targetWidth / 20);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = `rgba(255, 255, 255, ${transformations.watermarkOpacity})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Position at bottom right or center. Let's do bottom right.
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      transformations.watermarkText, 
      targetWidth / 2 - 20, 
      targetHeight / 2 - 20
    );
  }

  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      },
      format,
      quality
    );
  });
};

export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};
