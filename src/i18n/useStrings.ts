import { useMemo } from 'react';
import { STRINGS, type Locale, type Strings } from './strings';

/**
 * Hostname → locale resolution.
 * - *.fi          → fi
 * - *.com         → en
 * - localhost / other → en (override with ?lang=fi|en)
 */
export const detectLocale = (): Locale => {
  if (typeof window === 'undefined') return 'en';

  try {
    const params = new URLSearchParams(window.location.search);
    const override = params.get('lang');
    if (override === 'fi' || override === 'en') return override;
  } catch {
    // ignore — fallback to hostname
  }

  const host = window.location.hostname.toLowerCase();
  if (host.endsWith('.fi') || host.includes('xn--kuvanksittely')) return 'fi';
  if (host.endsWith('.com')) return 'en';
  return 'en';
};

export const useStrings = (): Strings & { _locale: Locale } => {
  return useMemo(() => {
    const locale = detectLocale();
    return { ...STRINGS[locale], _locale: locale };
  }, []);
};
