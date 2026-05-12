export type Rotation = 0 | 90 | 180 | 270;

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PipelineOps {
  crop?: CropRect;
  resize?: { w: number; h: number };
  rotation: Rotation;
  flipH: boolean;
  flipV: boolean;
  brightness: number;
  contrast: number;
  grayscale: boolean;
  sepia: boolean;
  format: 'image/png' | 'image/jpeg' | 'image/webp';
  quality: number;
  watermarkText?: string;
  watermarkOpacity?: number;
}

export type Pipeline = (
  source: ImageBitmap,
  ops: PipelineOps
) => Promise<{ blob: Blob; width: number; height: number }>;

type CanvasLike = OffscreenCanvas | HTMLCanvasElement;
type Drawable = ImageBitmap | OffscreenCanvas | HTMLCanvasElement;
type Canvas2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

const clamp = (value: number, min = 0, max = 255) => Math.min(max, Math.max(min, value));

const createCanvas = (width: number, height: number): CanvasLike => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const get2d = (canvas: CanvasLike) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) as Canvas2D | null;
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  return ctx;
};

const canvasToBlob = async (canvas: CanvasLike, type: PipelineOps['format'], quality: number) => {
  const normalizedQuality = type === 'image/png' ? undefined : quality;

  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type, quality: normalizedQuality });
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('Canvas toBlob failed'));
      },
      type,
      normalizedQuality
    );
  });
};

const sanitizeCrop = (source: ImageBitmap, crop?: CropRect): CropRect => {
  if (!crop) {
    return { x: 0, y: 0, w: source.width, h: source.height };
  }

  const x = clamp(Math.round(crop.x), 0, source.width - 1);
  const y = clamp(Math.round(crop.y), 0, source.height - 1);
  const w = clamp(Math.round(crop.w), 1, source.width - x);
  const h = clamp(Math.round(crop.h), 1, source.height - y);
  return { x, y, w, h };
};

const sanitizeResize = (resize: PipelineOps['resize'] | undefined, fallback: CropRect) => ({
  w: Math.max(1, Math.round(resize?.w || fallback.w)),
  h: Math.max(1, Math.round(resize?.h || fallback.h)),
});

const applyPixelFilters = (canvas: CanvasLike, ops: PipelineOps) => {
  if (ops.brightness === 100 && ops.contrast === 100 && !ops.grayscale && !ops.sepia) {
    return canvas;
  }

  const ctx = get2d(canvas);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const brightness = clamp(ops.brightness, 0, 200) / 100;
  const contrastValue = (clamp(ops.contrast, 0, 200) - 100) * 2.55;
  const contrast = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] * brightness;
    let g = data[i + 1] * brightness;
    let b = data[i + 2] * brightness;

    r = contrast * (r - 128) + 128;
    g = contrast * (g - 128) + 128;
    b = contrast * (b - 128) + 128;

    if (ops.grayscale) {
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = luma;
      g = luma;
      b = luma;
    }

    if (ops.sepia) {
      const sr = 0.393 * r + 0.769 * g + 0.189 * b;
      const sg = 0.349 * r + 0.686 * g + 0.168 * b;
      const sb = 0.272 * r + 0.534 * g + 0.131 * b;
      r = sr;
      g = sg;
      b = sb;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

const drawWatermark = (canvas: CanvasLike, ops: PipelineOps) => {
  const text = ops.watermarkText?.trim();
  if (!text) return;

  const ctx = get2d(canvas);
  const fontSize = Math.max(20, canvas.width / 20);
  ctx.save();
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = `rgba(255, 255, 255, ${ops.watermarkOpacity ?? 0.5})`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = Math.max(4, fontSize / 8);
  ctx.fillText(text, canvas.width - 20, canvas.height - 20);
  ctx.restore();
};

export const runPipeline: Pipeline = async (source, ops) => {
  const crop = sanitizeCrop(source, ops.crop);
  const resized = sanitizeResize(ops.resize, crop);

  const cropResizeCanvas = createCanvas(resized.w, resized.h);
  const cropResizeCtx = get2d(cropResizeCanvas);
  cropResizeCtx.drawImage(
    source,
    crop.x,
    crop.y,
    crop.w,
    crop.h,
    0,
    0,
    resized.w,
    resized.h
  );

  const isSideways = ops.rotation === 90 || ops.rotation === 270;
  const outputWidth = isSideways ? resized.h : resized.w;
  const outputHeight = isSideways ? resized.w : resized.h;
  const outputCanvas = createCanvas(outputWidth, outputHeight);
  const outputCtx = get2d(outputCanvas);

  outputCtx.save();
  outputCtx.translate(outputWidth / 2, outputHeight / 2);
  outputCtx.rotate((ops.rotation * Math.PI) / 180);
  outputCtx.scale(ops.flipH ? -1 : 1, ops.flipV ? -1 : 1);
  outputCtx.drawImage(cropResizeCanvas as Drawable, -resized.w / 2, -resized.h / 2);
  outputCtx.restore();

  const filteredCanvas = applyPixelFilters(outputCanvas, ops);
  drawWatermark(filteredCanvas, ops);

  const blob = await canvasToBlob(filteredCanvas, ops.format, ops.quality);
  return { blob, width: outputWidth, height: outputHeight };
};

export const decodeImage = async (file: Blob): Promise<ImageBitmap> => {
  return createImageBitmap(file);
};
