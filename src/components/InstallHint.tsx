import { useEffect, useState } from 'react';
import { Smartphone, Apple, Check } from 'lucide-react';
import { useStrings } from '../i18n/useStrings';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // @ts-expect-error iOS Safari adds this on navigator
  window.navigator.standalone === true;

const IphoneCopy = ({ locale, brand }: { locale: 'fi' | 'en'; brand: string }) => {
  if (locale === 'fi') {
    return (
      <p className="text-sm leading-relaxed text-charcoal/65">
        Avaa {brand} Safarissa. Paina <strong>Jaa</strong>, sitten{' '}
        <strong>Lisää koti-valikkoon</strong>. Varmista että{' '}
        <strong>Avaa verkkosovelluksena</strong> on päällä, ja paina <strong>Lisää</strong>.
      </p>
    );
  }
  return (
    <p className="text-sm leading-relaxed text-charcoal/65">
      Open {brand} in Safari. Tap <strong>Share</strong>, then{' '}
      <strong>Add to Home Screen</strong>. Make sure{' '}
      <strong>Open as Web App</strong> is on, then tap <strong>Add</strong>.
    </p>
  );
};

export const InstallHint = () => {
  const t = useStrings();
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
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
      id="install"
      className="w-full max-w-xl mx-auto pt-4 text-left scroll-mt-24"
    >
      <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-charcoal/40 mb-3 text-center">
        {t.installSection}
      </h2>

      <div className="grid gap-2.5">
        <article className="rounded-2xl border border-charcoal/10 bg-white/70 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-charcoal mb-1">
            <Apple className="h-4 w-4 text-auburn" />
            {t.iphoneSafariTitle}
          </div>
          <IphoneCopy locale={t._locale} brand={t.brandFull} />
        </article>

        <article className="rounded-2xl border border-charcoal/10 bg-white/70 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-bold text-charcoal mb-1">
            <Smartphone className="h-4 w-4 text-auburn" />
            {t.androidChromeTitle}
          </div>
          <p className="text-sm leading-relaxed text-charcoal/65 mb-3">
            {t.androidChromeCopy}
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
                {t.installing}
              </span>
            ) : (
              t.installAppBtn
            )}
          </button>
        </article>
      </div>
    </section>
  );
};
