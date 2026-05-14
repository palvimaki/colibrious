import { useStrings } from '../i18n/useStrings';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo = ({ size = 144, className = "" }: LogoProps) => {
  const t = useStrings();
  return (
    <img
      src="/pwa-512x512.png"
      alt={t.brandFull}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-[22%] shadow-lg shadow-auburn/20 ${className}`}
    />
  );
};

export const Wordmark = ({ className = "" }: { className?: string }) => {
  const t = useStrings();
  return (
    <span className={`font-bold tracking-tight text-auburn leading-none ${className}`}>
      {t.brandName}
      <span className="text-charcoal/40">{t.brandTld}</span>
    </span>
  );
};
