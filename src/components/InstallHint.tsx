import { useEffect, useState } from 'react';
import { Smartphone, Apple, Check } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // @ts-expect-error iOS Safari adds this on navigator
  window.navigator.standalone === true;

export const InstallHint = () => {
  const [installed, setInstalled] = useState(true);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const triggerNativePrompt = async () => {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setInstalled(true);
      setDeferred(null);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <section
      id="asenna"
      className="w-full max-w-xl mx-auto pt-4 text-left scroll-mt-24"
    >
      <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-charcoal/40 mb-3 text-center">
        Asenna sovellus
      </h2>

      <div className="grid gap-2.5">
        <article className="rounded-2xl border border-charcoal/10 bg-white/70 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-charcoal mb-1">
            <Apple className="h-4 w-4 text-auburn" />
            iPhone · Safari
          </div>
          <p className="text-sm leading-relaxed text-charcoal/65">
            Avaa kuvankäsittely.fi Safarissa. Paina <strong>Jaa</strong>, sitten{' '}
            <strong>Lisää koti-valikkoon</strong>. Varmista että{' '}
            <strong>Avaa verkkosovelluksena</strong> on päällä, ja paina <strong>Lisää</strong>.
          </p>
        </article>

        <article className="rounded-2xl border border-charcoal/10 bg-white/70 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-charcoal mb-1">
            <Smartphone className="h-4 w-4 text-auburn" />
            Android · Chrome / Edge
          </div>
          <p className="text-sm leading-relaxed text-charcoal/65 mb-3">
            Avaa sivu Chromessa tai Edgessä Androidilla. Kun selain on valmis, paina alla olevaa
            painiketta natiiviasennusta varten.
          </p>
          <button
            type="button"
            onClick={triggerNativePrompt}
            disabled={!deferred || installing}
            className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              deferred && !installing
                ? 'bg-auburn text-white hover:bg-auburn/90 active:scale-[0.99]'
                : 'cursor-not-allowed border border-charcoal/10 bg-charcoal/[0.04] text-charcoal/40'
            }`}
          >
            {installing ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Check className="h-3.5 w-3.5" />
                Asennetaan…
              </span>
            ) : (
              'Asenna kuvankäsittely.fi'
            )}
          </button>
        </article>
      </div>
    </section>
  );
};
