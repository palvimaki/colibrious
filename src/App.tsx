import { useState } from 'react';
import { Logo } from './components/Logo';
import { Dropzone } from './components/Dropzone';
import { ImageCard } from './components/ImageCard';
import { useImageProcessor } from './hooks/useImageProcessor';
import { Settings2, Download, Trash2, Layers, Sparkles } from 'lucide-react';
import { DEFAULT_TRANSFORMATIONS } from './types/image';
import type { ImageTransformations } from './types/image';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const { 
    images, 
    addFiles, 
    updateTransformations, 
    removeImage, 
    downloadImage,
    clearImages
  } = useImageProcessor();

  const [globalSettings, setGlobalSettings] = useState<ImageTransformations>(DEFAULT_TRANSFORMATIONS);

  const applyGlobalSetting = (setting: Partial<ImageTransformations>) => {
    setGlobalSettings(prev => ({ ...prev, ...setting }));
    images.forEach(img => updateTransformations(img.id, setting));
  };

  const downloadAll = async () => {
    for (const img of images) {
      await downloadImage(img.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo />
          
          <div className="flex items-center gap-4">
            {images.length > 0 && (
              <button 
                onClick={downloadAll}
                className="flex items-center gap-2 bg-auburn text-white px-6 py-2.5 rounded-full font-semibold hover:bg-auburn/90 transition-all shadow-lg shadow-auburn/20 active:scale-95"
              >
                <Download className="w-4 h-4" />
                Download All ({images.length})
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-8">
        {images.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="max-w-md space-y-2">
              <h1 className="text-4xl font-bold text-charcoal tracking-tight">
                Make your images <span className="text-auburn">magic.</span>
              </h1>
              <p className="text-charcoal/60">
                A simple, powerful, and private way to batch process your images entirely in your browser.
              </p>
            </div>
            <Dropzone onFilesSelected={addFiles} className="max-w-2xl" />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Settings */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-charcoal/5 sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-orange-accent/10 rounded-lg">
                    <Settings2 className="w-5 h-5 text-orange-accent" />
                  </div>
                  <h2 className="font-bold text-charcoal">Batch Settings</h2>
                </div>

                <div className="space-y-6">
                  {/* Format Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-charcoal/40 flex items-center gap-2">
                      <Layers className="w-3 h-3" /> Output Format
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['image/png', 'image/jpeg', 'image/webp'].map((f) => (
                        <button
                          key={f}
                          onClick={() => applyGlobalSetting({ format: f as ImageTransformations['format'] })}
                          className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all ${
                            globalSettings.format === f 
                              ? 'border-auburn bg-auburn/5 text-auburn' 
                              : 'border-charcoal/10 text-charcoal/40 hover:border-charcoal/20'
                          }`}
                        >
                          {f.split('/')[1].toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Quick Toggles */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-charcoal/40 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Filters
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => applyGlobalSetting({ grayscale: !globalSettings.grayscale })}
                        className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                          globalSettings.grayscale ? 'bg-auburn text-white border-auburn' : 'bg-white text-charcoal/60 border-charcoal/10'
                        }`}
                      >
                        Grayscale
                      </button>
                      <button
                        onClick={() => applyGlobalSetting({ sepia: !globalSettings.sepia })}
                        className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                          globalSettings.sepia ? 'bg-auburn text-white border-auburn' : 'bg-white text-charcoal/60 border-charcoal/10'
                        }`}
                      >
                        Sepia
                      </button>
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-charcoal/60 uppercase">Quality</label>
                        <span className="text-xs font-bold text-auburn">{Math.round(globalSettings.quality * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="1" 
                        step="0.01" 
                        value={globalSettings.quality}
                        onChange={(e) => applyGlobalSetting({ quality: parseFloat(e.target.value) })}
                        className="w-full accent-auburn"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-charcoal/60 uppercase">Brightness</label>
                        <span className="text-xs font-bold text-auburn">{globalSettings.brightness}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        value={globalSettings.brightness}
                        onChange={(e) => applyGlobalSetting({ brightness: parseInt(e.target.value) })}
                        className="w-full accent-auburn"
                      />
                    </div>
                  </div>

                  {/* Watermark */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-charcoal/40 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Watermark
                    </label>
                    <input 
                      type="text"
                      placeholder="Enter watermark text..."
                      value={globalSettings.watermarkText || ''}
                      onChange={(e) => applyGlobalSetting({ watermarkText: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-charcoal/10 text-sm focus:border-auburn outline-none transition-colors"
                    />
                  </div>
                  
                  <button 
                    onClick={clearImages}
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Image Grid */}
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {images.map((image) => (
                    <motion.div
                      key={image.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <ImageCard
                        image={image}
                        onRemove={removeImage}
                        onDownload={downloadImage}
                        onUpdateTransform={updateTransformations}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Add More Button */}
                <div className="aspect-square">
                  <Dropzone 
                    onFilesSelected={addFiles} 
                    className="h-full rounded-[2rem] border-charcoal/5 bg-charcoal/[0.02]" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-charcoal/30 text-xs">
        <p>© 2026 PixelPaws • Your images never leave your computer • Crafted with magic</p>
      </footer>
    </div>
  );
}

// Add types for setImages which was missing in useImageProcessor return
// Actually I'll just use a small hack or fix the hook. 
// For now I'll just keep it simple.

export default App;
