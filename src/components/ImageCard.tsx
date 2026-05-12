import { Trash2, Download, RotateCw, FlipHorizontal, FlipVertical, MoreHorizontal } from 'lucide-react';
import type { ProcessedImage, ImageTransformations } from '../types/image';

interface ImageCardProps {
  image: ProcessedImage;
  onRemove: (id: string) => void;
  onDownload: (id: string) => void;
  onUpdateTransform: (id: string, transform: Partial<ImageTransformations>) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ 
  image, 
  onRemove, 
  onDownload, 
  onUpdateTransform 
}) => {
  const { currentTransformations } = image;

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-charcoal/5">
      {/* Image Preview Area */}
      <div className="aspect-square relative overflow-hidden bg-cream/30">
        <img
          src={image.previewUrl}
          alt={image.originalFile.name}
          className="w-full h-full object-contain transition-transform duration-300"
          style={{
            transform: `rotate(${currentTransformations.rotation}deg) scaleX(${currentTransformations.flipHorizontal ? -1 : 1}) scaleY(${currentTransformations.flipVertical ? -1 : 1})`,
            filter: `brightness(${currentTransformations.brightness}%) contrast(${currentTransformations.contrast}%) ${currentTransformations.grayscale ? 'grayscale(100%)' : ''} ${currentTransformations.sepia ? 'sepia(100%)' : ''}`
          }}
        />
        
        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button 
            onClick={() => onDownload(image.id)}
            className="p-3 bg-white text-auburn rounded-full hover:scale-110 transition-transform"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onRemove(image.id)}
            className="p-3 bg-white text-red-500 rounded-full hover:scale-110 transition-transform"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info & Basic Controls */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="truncate pr-2">
            <p className="text-sm font-semibold text-charcoal truncate">{image.originalFile.name}</p>
            <p className="text-[10px] text-charcoal/40 uppercase">{(image.originalFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button className="text-charcoal/20 hover:text-auburn transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-charcoal/5">
          <button 
            onClick={() => onUpdateTransform(image.id, { rotation: (currentTransformations.rotation + 90) % 360 })}
            className="p-2 hover:bg-auburn/10 rounded-xl text-charcoal/60 hover:text-auburn transition-colors"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onUpdateTransform(image.id, { flipHorizontal: !currentTransformations.flipHorizontal })}
            className="p-2 hover:bg-auburn/10 rounded-xl text-charcoal/60 hover:text-auburn transition-colors"
            title="Flip Horizontal"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onUpdateTransform(image.id, { flipVertical: !currentTransformations.flipVertical })}
            className="p-2 hover:bg-auburn/10 rounded-xl text-charcoal/60 hover:text-auburn transition-colors"
            title="Flip Vertical"
          >
            <FlipVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {image.isProcessing && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-auburn border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
