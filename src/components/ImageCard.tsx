import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Crop,
  Download,
  FlipHorizontal,
  FlipVertical,
  MoreHorizontal,
  RotateCw,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import type { ProcessedImage, ImageTransformations } from '../types/image';
import type { CropRect, PipelineOps } from '../utils/pipeline';
import { decodeImage, runPipeline } from '../utils/pipeline';

interface ImageCardProps {
  image: ProcessedImage;
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
  onUpdateTransform: (id: string, transform: Partial<ImageTransformations>) => void;
}

type CropMode = 'free' | '1:1' | '4:3' | '16:9' | '3:2';
type DragMode = 'move' | 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

const ASPECTS: Array<{ label: string; mode: CropMode; ratio?: number }> = [
  { label: 'Vapaa', mode: 'free' },
  { label: '1:1', mode: '1:1', ratio: 1 },
  { label: '4:3', mode: '4:3', ratio: 4 / 3 },
  { label: '16:9', mode: '16:9', ratio: 16 / 9 },
  { label: '3:2', mode: '3:2', ratio: 3 / 2 },
];

const formatBytes = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const toPipelineOps = (transformations: ImageTransformations): PipelineOps => ({
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

const clampRect = (rect: CropRect, maxW: number, maxH: number): CropRect => {
  const w = Math.min(maxW, Math.max(20, Math.round(rect.w)));
  const h = Math.min(maxH, Math.max(20, Math.round(rect.h)));
  const x = Math.min(maxW - w, Math.max(0, Math.round(rect.x)));
  const y = Math.min(maxH - h, Math.max(0, Math.round(rect.y)));
  return { x, y, w, h };
};

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onRemove,
  onDownload,
  onUpdateTransform,
}) => {
  const { currentTransformations } = image;
  const previewUrlRef = useRef<string | null>(null);
  const previewBoxRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    startCrop: CropRect;
  } | null>(null);

  const [previewSrc, setPreviewSrc] = useState<string>(image.previewUrl);
  const [previewMeta, setPreviewMeta] = useState<{
    width: number;
    height: number;
    size: number;
    isPreview: boolean;
  } | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropMode, setCropMode] = useState<CropMode>('free');
  const [draftCrop, setDraftCrop] = useState<CropRect>({
    x: 0,
    y: 0,
    w: image.originalWidth,
    h: image.originalHeight,
  });

  const baseSize = useMemo(() => {
    const crop = currentTransformations.crop;
    return {
      w: Math.round(crop?.w || image.originalWidth),
      h: Math.round(crop?.h || image.originalHeight),
    };
  }, [currentTransformations.crop, image.originalHeight, image.originalWidth]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setIsPreviewing(true);
        const source = await decodeImage(image.originalFile);
        let result: Awaited<ReturnType<typeof runPipeline>>;
        try {
          result = await runPipeline(source, toPipelineOps(currentTransformations), {
            previewMaxEdge: 1600,
          });
        } finally {
          source.close();
        }
        const nextUrl = URL.createObjectURL(result.blob);

        if (cancelled) {
          URL.revokeObjectURL(nextUrl);
          return;
        }

        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        previewUrlRef.current = nextUrl;
        setPreviewSrc(nextUrl);
        setPreviewMeta({
          width: result.width,
          height: result.height,
          size: result.sizeEstimate,
          isPreview: result.isPreview,
        });
      } catch (error) {
        console.error('Preview failed:', error);
      } finally {
        if (!cancelled) setIsPreviewing(false);
      }
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentTransformations, image.originalFile]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    []
  );

  const openCrop = () => {
    setDraftCrop(
      currentTransformations.crop || {
        x: 0,
        y: 0,
        w: image.originalWidth,
        h: image.originalHeight,
      }
    );
    setCropMode('free');
    setCropOpen(true);
  };

  const applyCropMode = (mode: CropMode) => {
    setCropMode(mode);
    const ratio = ASPECTS.find((item) => item.mode === mode)?.ratio;
    if (!ratio) return;

    setDraftCrop((current) => {
      let w = current.w;
      let h = w / ratio;

      if (h > current.h) {
        h = current.h;
        w = h * ratio;
      }

      return clampRect(
        {
          x: current.x + (current.w - w) / 2,
          y: current.y + (current.h - h) / 2,
          w,
          h,
        },
        image.originalWidth,
        image.originalHeight
      );
    });
  };

  const getImageBox = () => {
    const box = previewBoxRef.current?.getBoundingClientRect();
    if (!box) return null;

    const imageAspect = image.originalWidth / image.originalHeight;
    const boxAspect = box.width / box.height;

    if (boxAspect > imageAspect) {
      const height = box.height;
      const width = height * imageAspect;
      return {
        left: box.left + (box.width - width) / 2,
        top: box.top,
        width,
        height,
      };
    }

    const width = box.width;
    const height = width / imageAspect;
    return {
      left: box.left,
      top: box.top + (box.height - height) / 2,
      width,
      height,
    };
  };

  const displayRect = (rect: CropRect) => {
    const imageAspect = image.originalWidth / image.originalHeight;
    const imageBox =
      imageAspect >= 1
        ? {
            left: 0,
            top: (100 - 100 / imageAspect) / 2,
            width: 100,
            height: 100 / imageAspect,
          }
        : {
            left: (100 - imageAspect * 100) / 2,
            top: 0,
            width: imageAspect * 100,
            height: 100,
          };

    return {
      left: `${imageBox.left + (rect.x / image.originalWidth) * imageBox.width}%`,
      top: `${imageBox.top + (rect.y / image.originalHeight) * imageBox.height}%`,
      width: `${(rect.w / image.originalWidth) * imageBox.width}%`,
      height: `${(rect.h / image.originalHeight) * imageBox.height}%`,
    };
  };

  const resizeDraftCrop = (mode: DragMode, dx: number, dy: number, start: CropRect) => {
    const ratio = ASPECTS.find((item) => item.mode === cropMode)?.ratio;
    let left = start.x;
    let right = start.x + start.w;
    let top = start.y;
    let bottom = start.y + start.h;

    if (mode.includes('w')) left += dx;
    if (mode.includes('e')) right += dx;
    if (mode.includes('n')) top += dy;
    if (mode.includes('s')) bottom += dy;

    if (mode === 'move') {
      return clampRect({ ...start, x: start.x + dx, y: start.y + dy }, image.originalWidth, image.originalHeight);
    }

    left = Math.max(0, Math.min(left, image.originalWidth - 20));
    right = Math.max(20, Math.min(right, image.originalWidth));
    top = Math.max(0, Math.min(top, image.originalHeight - 20));
    bottom = Math.max(20, Math.min(bottom, image.originalHeight));

    if (right - left < 20) {
      if (mode.includes('w')) left = right - 20;
      else right = left + 20;
    }
    if (bottom - top < 20) {
      if (mode.includes('n')) top = bottom - 20;
      else bottom = top + 20;
    }

    if (ratio) {
      let w = right - left;
      let h = bottom - top;

      if ((mode === 'n' || mode === 's') && h > 0) {
        w = h * ratio;
        const centerX = (left + right) / 2;
        left = centerX - w / 2;
        right = centerX + w / 2;
      } else {
        h = w / ratio;
        if (mode.includes('n')) top = bottom - h;
        else bottom = top + h;
      }
    }

    return clampRect({ x: left, y: top, w: right - left, h: bottom - top }, image.originalWidth, image.originalHeight);
  };

  const updateDrag = (clientX: number, clientY: number) => {
    const drag = dragRef.current;
    const imageBox = getImageBox();
    if (!drag || !imageBox) return;

    const dx = ((clientX - drag.startX) / imageBox.width) * image.originalWidth;
    const dy = ((clientY - drag.startY) / imageBox.height) * image.originalHeight;
    setDraftCrop(resizeDraftCrop(drag.mode, dx, dy, drag.startCrop));
  };

  const startDrag = (mode: DragMode, event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: draftCrop,
    };
  };

  const cropDisplay = cropOpen ? displayRect(draftCrop) : null;

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-charcoal/5">
      <div ref={previewBoxRef} className="aspect-square relative overflow-hidden bg-cream/30 touch-none">
        <img
          src={cropOpen ? image.previewUrl : previewSrc}
          alt={image.originalFile.name}
          className="w-full h-full object-contain"
        />

        {cropOpen && cropDisplay && (
          <div className="absolute inset-0 bg-charcoal/45">
            <div
              className="absolute border-2 border-white bg-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
              style={cropDisplay}
              onPointerDown={(event) => startDrag('move', event)}
              onPointerMove={(event) => updateDrag(event.clientX, event.clientY)}
              onPointerUp={() => {
                dragRef.current = null;
              }}
            >
              {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as DragMode[]).map((mode) => {
                const position =
                  mode === 'nw'
                    ? '-left-1.5 -top-1.5 cursor-nwse-resize'
                    : mode === 'n'
                      ? 'left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize'
                      : mode === 'ne'
                        ? '-right-1.5 -top-1.5 cursor-nesw-resize'
                        : mode === 'e'
                          ? '-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize'
                          : mode === 'se'
                            ? '-right-1.5 -bottom-1.5 cursor-nwse-resize'
                            : mode === 's'
                              ? 'left-1/2 -bottom-1.5 -translate-x-1/2 cursor-ns-resize'
                              : mode === 'sw'
                                ? '-left-1.5 -bottom-1.5 cursor-nesw-resize'
                                : '-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize';

                return (
                  <button
                    key={mode}
                    type="button"
                    aria-label={`Rajauskahva ${mode}`}
                    className={`absolute h-4 w-4 rounded-full border-2 border-white bg-auburn ${position}`}
                    onPointerDown={(event) => startDrag(mode, event)}
                    onPointerMove={(event) => updateDrag(event.clientX, event.clientY)}
                    onPointerUp={() => {
                      dragRef.current = null;
                    }}
                  />
                );
              })}
            </div>

            <div className="absolute left-3 right-3 top-3 rounded-2xl bg-white/95 p-2 shadow-sm">
              <div className="grid grid-cols-5 gap-1">
                {ASPECTS.map((aspect) => (
                  <button
                    key={aspect.mode}
                    type="button"
                    onClick={() => applyCropMode(aspect.mode)}
                    className={`rounded-xl px-2 py-1 text-[10px] font-bold ${
                      cropMode === aspect.mode ? 'bg-auburn text-white' : 'bg-charcoal/5 text-charcoal/60'
                    }`}
                  >
                    {aspect.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateTransform(image.id, { crop: clampRect(draftCrop, image.originalWidth, image.originalHeight) });
                  setCropOpen(false);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-auburn px-3 py-2 text-xs font-bold text-white"
              >
                <Check className="h-4 w-4" />
                Käytä
              </button>
              <button
                type="button"
                onClick={() => setCropOpen(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-charcoal"
              >
                <X className="h-4 w-4" />
                Peruuta
              </button>
            </div>
          </div>
        )}

        {!cropOpen && (
          <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(image.id)}
              className="p-3 bg-white text-auburn rounded-full hover:scale-110 transition-transform"
              aria-label="Lataa kuva"
              title="Lataa"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(image.id)}
              className="p-3 bg-white text-red-500 rounded-full hover:scale-110 transition-transform"
              aria-label="Poista kuva"
              title="Poista"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="min-w-0 pr-2">
            <p className="text-sm font-semibold text-charcoal truncate">{image.originalFile.name}</p>
            <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold text-charcoal/45">
              <span>{image.originalWidth}×{image.originalHeight}</span>
              <span>→ {previewMeta ? `${previewMeta.width}×${previewMeta.height}` : `${baseSize.w}×${baseSize.h}`}</span>
              <span>
                {formatBytes(image.originalFile.size)} →{' '}
                {previewMeta ? `${previewMeta.isPreview ? '≈ ' : ''}${formatBytes(previewMeta.size)}` : '…'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAdjustOpen((value) => !value)}
            className="text-charcoal/20 hover:text-auburn transition-colors"
            aria-label="Säädöt"
            title="Säädöt"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-charcoal/5">
          <button
            type="button"
            onClick={() =>
              onUpdateTransform(image.id, {
                rotation: ((currentTransformations.rotation + 90) % 360) as ImageTransformations['rotation'],
              })
            }
            className="p-2 hover:bg-auburn/10 rounded-xl text-charcoal/60 hover:text-auburn transition-colors"
            aria-label="Kierrä 90 astetta"
            title="Kierrä 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateTransform(image.id, { flipHorizontal: !currentTransformations.flipHorizontal })}
            className="p-2 hover:bg-auburn/10 rounded-xl text-charcoal/60 hover:text-auburn transition-colors"
            aria-label="Käännä vaakatasossa"
            title="Käännä vaakatasossa"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onUpdateTransform(image.id, { flipVertical: !currentTransformations.flipVertical })}
            className="p-2 hover:bg-auburn/10 rounded-xl text-charcoal/60 hover:text-auburn transition-colors"
            aria-label="Käännä pystysuunnassa"
            title="Käännä pystysuunnassa"
          >
            <FlipVertical className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={openCrop}
            className="p-2 hover:bg-auburn/10 rounded-xl text-charcoal/60 hover:text-auburn transition-colors"
            aria-label="Rajaa"
            title="Rajaa"
          >
            <Crop className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAdjustOpen((value) => !value)}
            className="ml-auto p-2 hover:bg-auburn/10 rounded-xl text-charcoal/60 hover:text-auburn transition-colors"
            aria-label="Säädöt"
            title="Säädöt"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {adjustOpen && (
          <div className="space-y-4 rounded-2xl border border-charcoal/5 bg-charcoal/[0.02] p-3">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-charcoal/45">Muoto</label>
              <div className="grid grid-cols-3 gap-2">
                {(['image/png', 'image/jpeg', 'image/webp'] as ImageTransformations['format'][]).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => onUpdateTransform(image.id, { format })}
                    className={`rounded-xl border px-2 py-2 text-[10px] font-bold ${
                      currentTransformations.format === format
                        ? 'border-auburn bg-auburn/5 text-auburn'
                        : 'border-charcoal/10 text-charcoal/45'
                    }`}
                  >
                    {format.split('/')[1].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {currentTransformations.format === 'image/png' ? (
              <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
                Häviötön
              </span>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-[10px] font-bold uppercase text-charcoal/45">Laatu</label>
                  <span className="text-[10px] font-bold text-auburn">
                    {Math.round(currentTransformations.quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={currentTransformations.quality}
                  onChange={(event) => onUpdateTransform(image.id, { quality: Number(event.target.value) })}
                  aria-label="Pakkauslaatu"
                  className="w-full accent-auburn"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {(image.isProcessing || isPreviewing) && (
        <div className="absolute inset-0 pointer-events-none bg-white/40 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-auburn border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
