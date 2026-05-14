import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, className }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  }, [onFilesSelected]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl transition-all duration-300",
        isDragging 
          ? "border-orange-accent bg-orange-accent/5 scale-[1.01]" 
          : "border-charcoal/20 bg-white hover:border-auburn/40 hover:bg-auburn/5",
        className
      )}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="flex flex-col items-center text-center space-y-4 px-6">
        <div className="p-4 bg-cream rounded-2xl shadow-sm">
          <Upload className="w-10 h-10 text-auburn" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-charcoal">Pudota kuvat tähän</h3>
          <p className="text-sm text-charcoal/60 mt-1">
            PNG, JPEG, WebP, GIF — kaikki onnistuvat.
          </p>
        </div>
        <div className="flex items-center gap-2 text-auburn font-medium bg-auburn/10 px-4 py-2 rounded-full text-sm">
          <ImageIcon className="w-4 h-4" />
          Valitse tiedostot
        </div>
      </div>
    </div>
  );
};
