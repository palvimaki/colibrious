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

const get2d = (canvas: CanvasLike, willReadFrequently = false) => {
  const ctx = canvas.getContext('2d', { willReadFrequently }) as Canvas2D | null;
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  return ctx;
};

/** True when any per-pixel filter is active (i.e. we must read back pixels). */
const hasPixelFilter = (ops: PipelineOps) =>
  ops.brightness !== 100 || ops.contrast !== 100 || ops.grayscale || ops.sepia;

const KNOWN_FORMATS: ReadonlySet<string> = new Set(['image/png', 'image/jpeg', 'image/webp']);

const canvasToBlob = async (
  canvas: CanvasLike,
  type: PipelineOps['format'],
  quality: number
): Promise<{ blob: Blob; type: PipelineOps['format'] }> => {
  const normalizedQuality = type === 'image/png' ? undefined : quality;

  const blob = await (async (): Promise<Blob | null> => {
    if ('convertToBlob' in canvas) {
      try {
        return await canvas.convertToBlob({ type, quality: normalizedQuality });
      } catch {
        // convertToBlob rejected (often unsupported type) → fall through to fallback.
        return null;
      }
    }
    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, normalizedQuality)
    );
  })();

  if (blob) {
    // Derive the ACTUAL format from the blob's own type. Some browsers, when
    // asked for an unsupported type (notably WebP on older Safari), hand back a
    // PNG blob instead of null. Trusting the requested type here would save PNG
    // bytes under a .webp name (and mislabel the result).
    const actual = KNOWN_FORMATS.has(blob.type)
      ? (blob.type as PipelineOps['format'])
      : type;
    return { blob, type: actual };
  }

  // WebP encode is not supported by every browser (notably older Safari).
  // Fall back to lossless PNG rather than failing the whole operation.
  if (type === 'image/webp') {
    return canvasToBlob(canvas, 'image/png', quality);
  }

  throw new Error('Canvas toBlob failed');
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
  if (!hasPixelFilter(ops)) {
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

export interface PipelineOptions {
  previewMaxEdge?: number;
}

export interface PipelineResult {
  blob: Blob;
  width: number;
  height: number;
  sizeEstimate: number;
  isPreview: boolean;
  /** Format actually written (may differ from requested, e.g. WebP→PNG fallback). */
  format: PipelineOps['format'];
}

export const runPipeline = async (
  source: ImageBitmap,
  ops: PipelineOps,
  options: PipelineOptions = {}
): Promise<PipelineResult> => {
  const crop = sanitizeCrop(source, ops.crop);
  const resized = sanitizeResize(ops.resize, crop);

  const isSideways = ops.rotation === 90 || ops.rotation === 270;
  const trueOutputWidth = isSideways ? resized.h : resized.w;
  const trueOutputHeight = isSideways ? resized.w : resized.h;

  const longestTrue = Math.max(trueOutputWidth, trueOutputHeight);
  const scale =
    options.previewMaxEdge && longestTrue > options.previewMaxEdge
      ? options.previewMaxEdge / longestTrue
      : 1;
  const isPreview = scale < 1;

  const scaledW = Math.max(1, Math.round(resized.w * scale));
  const scaledH = Math.max(1, Math.round(resized.h * scale));

  const cropResizeCanvas = createCanvas(scaledW, scaledH);
  const cropResizeCtx = get2d(cropResizeCanvas);
  cropResizeCtx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, scaledW, scaledH);

  const outputWidth = isSideways ? scaledH : scaledW;
  const outputHeight = isSideways ? scaledW : scaledH;
  const outputCanvas = createCanvas(outputWidth, outputHeight);
  // Only request the CPU-backed (willReadFrequently) context when a pixel
  // filter will actually read pixels; otherwise let the browser use the GPU.
  const outputCtx = get2d(outputCanvas, hasPixelFilter(ops));

  if (ops.format === 'image/jpeg') {
    outputCtx.fillStyle = '#ffffff';
    outputCtx.fillRect(0, 0, outputWidth, outputHeight);
  }

  outputCtx.save();
  outputCtx.translate(outputWidth / 2, outputHeight / 2);
  outputCtx.rotate((ops.rotation * Math.PI) / 180);
  outputCtx.scale(ops.flipH ? -1 : 1, ops.flipV ? -1 : 1);
  outputCtx.drawImage(cropResizeCanvas as Drawable, -scaledW / 2, -scaledH / 2);
  outputCtx.restore();

  const filteredCanvas = applyPixelFilters(outputCanvas, ops);
  drawWatermark(filteredCanvas, ops);

  const { blob, type: format } = await canvasToBlob(filteredCanvas, ops.format, ops.quality);
  const sizeEstimate = isPreview ? Math.round(blob.size / (scale * scale)) : blob.size;

  return {
    blob,
    width: trueOutputWidth,
    height: trueOutputHeight,
    sizeEstimate,
    isPreview,
    format,
  };
};

export const decodeImage = async (file: Blob): Promise<ImageBitmap> => {
  return createImageBitmap(file);
};

let webpEncodeSupported: boolean | null = null;
let webpCheck: Promise<boolean> | null = null;

/**
 * Whether this browser can *encode* WebP via canvas.toBlob/convertToBlob.
 * (Decode support is far more widespread than encode support — notably spotty
 * on older Safari.) Resolves once and caches.
 */
export const supportsWebpEncode = (): Promise<boolean> => {
  if (webpEncodeSupported !== null) return Promise.resolve(webpEncodeSupported);
  if (webpCheck) return webpCheck;

  webpCheck = new Promise<boolean>((resolve) => {
    try {
      const probe = document.createElement('canvas');
      probe.width = 1;
      probe.height = 1;
      probe.toBlob((blob) => {
        // Some browsers return a PNG blob (not null) when WebP encode is
        // unsupported, so the type must match, not just truthiness.
        webpEncodeSupported = !!blob && blob.type === 'image/webp';
        resolve(webpEncodeSupported);
      }, 'image/webp');
    } catch {
      webpEncodeSupported = false;
      resolve(false);
    }
  });
  return webpCheck;
};
