import { useEffect, useState } from 'react';
import { Smartphone, Share, Plus, MoreVertical, X } from 'lucide-react';

type Platform = 'ios' | 'android' | 'desktop';

const detectPlatform = (): Platform => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
};

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // @ts-expect-error iOS Safari adds this on navigator
  window.navigator.standalone === true;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export const InstallHint = () => {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [installed, setInstalled] = useState(true);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (installed) return null;

  const triggerNativePrompt = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => (deferred ? triggerNativePrompt() : setOpen(true))}
        className="inline-flex items-center gap-2 rounded-full border border-charcoal/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-charcoal/70 hover:border-auburn/30 hover:text-auburn transition-colors"
      >
        <Smartphone className="h-3.5 w-3.5" />
        Asenna sovellus
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-charcoal/40 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-charcoal/40 hover:text-charcoal"
              aria-label="Sulje"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-charcoal">Asenna kuvankäsittely.fi</h3>
            <p className="mt-1 text-sm text-charcoal/60">
              Lisää aloitusnäytölle ja käytä kuten sovellusta — myös ilman verkkoa.
            </p>

            {platform === 'ios' && (
              <ol className="mt-4 space-y-3 text-sm text-charcoal/80">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-auburn">1.</span>
                  <span>
                    Avaa Safarissa ja paina Jaa-painiketta{' '}
                    <Share className="inline h-4 w-4 align-text-bottom text-auburn" />
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-auburn">2.</span>
                  <span>
                    Valitse <strong>Lisää Koti-valikkoon</strong>{' '}
                    <Plus className="inline h-4 w-4 align-text-bottom text-auburn" />
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-auburn">3.</span>
                  <span>
                    Vahvista painamalla <strong>Lisää</strong>.
                  </span>
                </li>
              </ol>
            )}

            {platform === 'android' && (
              <ol className="mt-4 space-y-3 text-sm text-charcoal/80">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-auburn">1.</span>
                  <span>
                    Avaa Chromessa ja paina valikkoa{' '}
                    <MoreVertical className="inline h-4 w-4 align-text-bottom text-auburn" />
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-auburn">2.</span>
                  <span>
                    Valitse <strong>Asenna sovellus</strong> tai{' '}
                    <strong>Lisää aloitusnäyttöön</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-auburn">3.</span>
                  <span>Vahvista asennus.</span>
                </li>
              </ol>
            )}

            {platform === 'desktop' && (
              <ol className="mt-4 space-y-3 text-sm text-charcoal/80">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-auburn">1.</span>
                  <span>
                    Chrome / Edge: paina osoitepalkin oikealla olevaa{' '}
                    <strong>asenna-kuvaketta</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-auburn">2.</span>
                  <span>
                    Safari (macOS 14+): valikko <strong>Tiedosto → Lisää Dockiin</strong>.
                  </span>
                </li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
};
