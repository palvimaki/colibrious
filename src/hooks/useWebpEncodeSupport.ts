import { useEffect, useState } from 'react';
import { supportsWebpEncode } from '../utils/pipeline';

/**
 * Returns whether the current browser can encode WebP. Defaults to `true`
 * (assume capable) until the async probe resolves, so the option is visible
 * by default; the pipeline still falls back to PNG if the probe was wrong.
 */
export const useWebpEncodeSupport = (): boolean => {
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    let active = true;
    supportsWebpEncode().then((ok) => {
      if (active) setSupported(ok);
    });
    return () => {
      active = false;
    };
  }, []);
  return supported;
};
