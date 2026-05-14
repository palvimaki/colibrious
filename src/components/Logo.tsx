export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/pwa-192x192.png"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 rounded-xl"
      />
      <span className="text-xl font-bold tracking-tight text-auburn leading-none">
        kuvankäsittely<span className="text-charcoal/40">.fi</span>
      </span>
    </div>
  );
};
