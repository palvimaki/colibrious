import { useEffect, useState } from 'react';
import { Smartphone, ChevronDown, X } from 'lucide-react';
import { useStrings } from '../i18n/useStrings';

const isMobile = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
  // iPadOS Safari can present a Macintosh desktop UA. Touch-capable Mac is iPad in practice.
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
  return false;
};

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // @ts-expect-error iOS Safari adds this on navigator
  window.navigator.standalone === true;

interface InstallBannerProps {
  targetId?: string;
}

export const InstallBanner = ({ targetId = 'install' }: InstallBannerProps) => {
  const t = useStrings();
  const [eligible, setEligible] = useState<boolean>(() => !isStandalone() && isMobile());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onInstalled = () => setEligible(false);
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  if (!eligible || dismissed) return null;

  return (
    <div
      className="flex items-stretch gap-1 bg-auburn text-sm font-semibold text-white shadow-md"
      style={{ paddingTop: 'max(0.25rem, env(safe-area-inset-top))' }}
    >
      <a
        href={`#${targetId}`}
        className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 active:bg-auburn/90"
      >
        <Smartphone className="h-4 w-4" />
        {t.installBannerText}
        <ChevronDown className="h-4 w-4 opacity-70" />
      </a>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="px-3 text-white/85 hover:bg-white/15 active:bg-white/20"
        aria-label={t.installBannerCloseAria}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
