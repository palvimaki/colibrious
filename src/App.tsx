import { useState } from 'react';
import { Logo, Wordmark } from './components/Logo';
import { Dropzone } from './components/Dropzone';
import { ImageCard } from './components/ImageCard';
import { InstallHint } from './components/InstallHint';
import { useImageProcessor } from './hooks/useImageProcessor';
import {
  Settings2,
  Download,
  Trash2,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';

const GithubIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden="true">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);
import { DEFAULT_TRANSFORMATIONS } from './types/image';
import type { ImageTransformations, ProcessedImage } from './types/image';
import { motion, AnimatePresence } from 'framer-motion';

type ResizeUnit = 'px' | '%';

const REPO_URL = 'https://github.com/palvimaki/kuvankasittely.fi';

function App() {
  const {
    images,
    addFiles,
    updateTransformations,
    removeImage,
    downloadImage,
    clearImages,
  } = useImageProcessor();

  const [globalSettings, setGlobalSettings] = useState<ImageTransformations>(DEFAULT_TRANSFORMATIONS);
  const [batchResizeUnit, setBatchResizeUnit] = useState<ResizeUnit>('px');
  const [batchAspectLocked, setBatchAspectLocked] = useState(true);
  const [batchWidth, setBatchWidth] = useState('');
  const [batchHeight, setBatchHeight] = useState('');
  const [batchFitEdge, setBatchFitEdge] = useState('');

  const applyGlobalSetting = (setting: Partial<ImageTransformations>) => {
    setGlobalSettings(prev => ({ ...prev, ...setting }));
    images.forEach(img => updateTransformations(img.id, setting));
  };

  const downloadAll = async () => {
    for (const img of images) {
      await downloadImage(img.id);
    }
  };

  const getBaseSize = (image: ProcessedImage) => ({
    w: Math.round(image.currentTransformations.crop?.w || image.originalWidth),
    h: Math.round(image.currentTransformations.crop?.h || image.originalHeight),
  });

  const applyBatchResize = (widthValue: string, heightValue: string, changed: 'w' | 'h') => {
    const widthNumber = Number(widthValue);
    const heightNumber = Number(heightValue);
    const primary = changed === 'w' ? widthNumber : heightNumber;
    if (!Number.isFinite(primary) || primary <= 0) return;
    if (!batchAspectLocked) {
      if (!Number.isFinite(widthNumber) || widthNumber <= 0) return;
      if (!Number.isFinite(heightNumber) || heightNumber <= 0) return;
    }

    images.forEach((image) => {
      const base = getBaseSize(image);

      if (batchResizeUnit === '%') {
        const nextWPercent = batchAspectLocked && changed === 'h' ? heightNumber : widthNumber;
        const nextHPercent = batchAspectLocked ? nextWPercent : heightNumber;
        updateTransformations(image.id, {
          width: Math.max(1, Math.round(base.w * (nextWPercent / 100))),
          height: Math.max(1, Math.round(base.h * (nextHPercent / 100))),
        });
        return;
      }

      const nextWidth = changed === 'h' && batchAspectLocked ? Math.round(heightNumber * (base.w / base.h)) : widthNumber;
      const nextHeight = changed === 'w' && batchAspectLocked ? Math.round(widthNumber * (base.h / base.w)) : heightNumber;

      updateTransformations(image.id, {
        width: Math.max(1, Math.round(nextWidth)),
        height: Math.max(1, Math.round(nextHeight)),
      });
    });
  };

  const applyBatchFitEdge = () => {
    const edge = Number(batchFitEdge);
    if (!Number.isFinite(edge) || edge <= 0) return;

    images.forEach((image) => {
      const base = getBaseSize(image);
      const resize =
        base.w >= base.h
          ? { width: Math.round(edge), height: Math.round(edge * (base.h / base.w)) }
          : { width: Math.round(edge * (base.w / base.h)), height: Math.round(edge) };
      updateTransformations(image.id, resize);
    });
  };

  return (
    <div className="min-h-svh flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-charcoal/5 px-4 sm:px-6 py-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <a href="/" className="flex items-center text-lg">
            <Wordmark />
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            {images.length > 0 && (
              <button
                onClick={downloadAll}
                className="inline-flex items-center gap-2 bg-auburn text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-semibold hover:bg-auburn/90 transition-all shadow-lg shadow-auburn/20 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Lataa kaikki ({images.length})</span>
                <span className="sm:hidden">{images.length}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-8">
        {images.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-[calc(100svh-220px)] flex flex-col items-center justify-center text-center space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7 max-w-3xl">
              <Logo size={144} className="shrink-0" />
              <div className="space-y-3 text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold text-charcoal tracking-tight">
                  Kuvankäsittelyä <span className="text-auburn">selaimessa.</span>
                </h1>
                <p className="text-charcoal/60 text-base sm:text-lg leading-relaxed max-w-lg">
                  Muunna kuvia, muuta kuvan kokoa, lisää vesileimoja — kaikki suoraan selaimessasi.
                  Ei kirjautumista, toimii ilman verkkoa.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-charcoal/55">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-charcoal/[0.04] px-3 py-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                    Ei evästeitä
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-charcoal/[0.04] px-3 py-1">
                    <Lock className="h-3.5 w-3.5 text-emerald-700" />
                    Ei latauksia palvelimelle
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-charcoal/[0.04] px-3 py-1">
                    <GithubIcon className="h-3.5 w-3.5" />
                    Avoin lähdekoodi (MIT)
                  </span>
                </div>
              </div>
            </div>
            <Dropzone onFilesSelected={addFiles} className="max-w-2xl" />
            <InstallHint />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Settings */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-charcoal/5 sticky top-24">
                <div className="mb-6 flex items-start gap-2">
                  <div className="p-2 bg-orange-accent/10 rounded-lg">
                    <Settings2 className="w-5 h-5 text-orange-accent" />
                  </div>
                  <div>
                    <h2 className="font-bold text-charcoal">Eräasetukset</h2>
                    <p className="text-[10px] text-charcoal/40">Koskee kaikkia kuvia. Rajaus on kuvakohtainen.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Format Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-charcoal/40 flex items-center gap-2">
                      <Layers className="w-3 h-3" /> Tallennusmuoto
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

                  {/* Batch Resize */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-charcoal/40">
                        Aseta tarkat mitat
                      </label>
                      <div className="flex rounded-full bg-charcoal/[0.04] p-1 text-[10px] font-bold">
                        {(['px', '%'] as ResizeUnit[]).map((unit) => (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => setBatchResizeUnit(unit)}
                            className={`rounded-full px-2 py-1 ${
                              batchResizeUnit === unit ? 'bg-auburn text-white' : 'text-charcoal/45'
                            }`}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="L"
                        value={batchWidth}
                        onChange={(event) => {
                          setBatchWidth(event.target.value);
                          if (batchAspectLocked && batchResizeUnit === '%') setBatchHeight(event.target.value);
                          applyBatchResize(event.target.value, batchHeight, 'w');
                        }}
                        className="min-w-0 rounded-xl border border-charcoal/10 px-3 py-2 text-xs outline-none focus:border-auburn"
                        aria-label="Eräleveys"
                      />
                      <button
                        type="button"
                        onClick={() => setBatchAspectLocked((value) => !value)}
                        className="rounded-xl border border-charcoal/10 bg-white p-2 text-charcoal/50"
                        title={batchAspectLocked ? 'Vapauta kuvasuhde' : 'Lukitse kuvasuhde'}
                      >
                        {batchAspectLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                      </button>
                      <input
                        type="number"
                        min="1"
                        placeholder="K"
                        value={batchHeight}
                        onChange={(event) => {
                          setBatchHeight(event.target.value);
                          if (batchAspectLocked && batchResizeUnit === '%') setBatchWidth(event.target.value);
                          applyBatchResize(batchWidth, event.target.value, 'h');
                        }}
                        className="min-w-0 rounded-xl border border-charcoal/10 px-3 py-2 text-xs outline-none focus:border-auburn"
                        aria-label="Eräkorkeus"
                      />
                    </div>
                    <div className="space-y-2 border-t border-charcoal/5 pt-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-charcoal/40">
                        Tai sovita pisin sivu
                      </label>
                      <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1">
                          <input
                            type="number"
                            min="1"
                            placeholder="1920"
                            value={batchFitEdge}
                            onChange={(event) => setBatchFitEdge(event.target.value)}
                            className="w-full min-w-0 rounded-xl border border-charcoal/10 px-3 py-2 pr-8 text-xs outline-none focus:border-auburn"
                            aria-label="Pisin sivu pikseleinä"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-charcoal/40">
                            px
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={applyBatchFitEdge}
                          className="rounded-xl bg-charcoal px-3 py-2 text-[10px] font-bold text-white"
                        >
                          Käytä
                        </button>
                      </div>
                      <p className="text-[10px] leading-snug text-charcoal/50">
                        Skaalaa kunkin kuvan niin, että pisin sivu vastaa annettua arvoa. Kuvasuhde säilyy.
                      </p>
                    </div>
                  </div>

                  {/* Filter Quick Toggles */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-charcoal/40 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Suodattimet
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => applyGlobalSetting({ grayscale: !globalSettings.grayscale })}
                        className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                          globalSettings.grayscale ? 'bg-auburn text-white border-auburn' : 'bg-white text-charcoal/60 border-charcoal/10'
                        }`}
                      >
                        Mustavalko
                      </button>
                      <button
                        onClick={() => applyGlobalSetting({ sepia: !globalSettings.sepia })}
                        className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
                          globalSettings.sepia ? 'bg-auburn text-white border-auburn' : 'bg-white text-charcoal/60 border-charcoal/10'
                        }`}
                      >
                        Seepia
                      </button>
                    </div>
                  </div>

                  {/* Sliders */}
                  <div className="space-y-4">
                    {globalSettings.format === 'image/png' ? (
                      <div className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase text-emerald-700">
                        Häviötön
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-xs font-bold text-charcoal/60 uppercase">Laatu</label>
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
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-charcoal/60 uppercase">Kirkkaus</label>
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
                      <Sparkles className="w-3 h-3" /> Vesileima
                    </label>
                    <input
                      type="text"
                      placeholder="Kirjoita vesileiman teksti…"
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
                    Tyhjennä
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

      <footer
        className="border-t border-charcoal/5 bg-white/40 px-4 sm:px-6 py-6 text-charcoal/50 text-xs"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-700" />
            Yksityinen — kuvat pysyvät laitteellasi. Ei evästeitä.
          </p>
          <div className="flex items-center gap-3">
            <span>Avoin lähdekoodi:</span>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/10 bg-white px-3 py-1 font-semibold text-charcoal/70 hover:border-auburn/40 hover:text-auburn transition-colors"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              GitHub
            </a>
            <span className="text-charcoal/30">·</span>
            <span>MIT-lisenssi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
