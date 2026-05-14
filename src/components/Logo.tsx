interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo = ({ size = 144, className = "" }: LogoProps) => {
  return (
    <img
      src="/pwa-512x512.png"
      alt="kuvankäsittely.fi"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`rounded-[22%] shadow-lg shadow-auburn/20 ${className}`}
    />
  );
};

export const Wordmark = ({ className = "" }: { className?: string }) => (
  <span className={`font-bold tracking-tight text-auburn leading-none ${className}`}>
    kuvankäsittely<span className="text-charcoal/40">.fi</span>
  </span>
);
