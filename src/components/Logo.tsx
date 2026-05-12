export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Simple Red Panda Face */}
        <circle cx="50" cy="55" r="35" fill="#A52A2A" /> {/* Main face */}
        <circle cx="30" cy="30" r="15" fill="#A52A2A" /> {/* Left ear */}
        <circle cx="70" cy="30" r="15" fill="#A52A2A" /> {/* Right ear */}
        <circle cx="30" cy="30" r="8" fill="#FFFDD0" /> {/* Left ear inner */}
        <circle cx="70" cy="30" r="8" fill="#FFFDD0" /> {/* Right ear inner */}
        
        {/* White face markings */}
        <path d="M25 50 Q35 45 45 55" stroke="#FFFDD0" strokeWidth="4" strokeLinecap="round" />
        <path d="M75 50 Q65 45 55 55" stroke="#FFFDD0" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="70" r="10" fill="#FFFDD0" /> {/* Muzzle */}
        
        {/* Eyes */}
        <circle cx="40" cy="55" r="3" fill="#333333" />
        <circle cx="60" cy="55" r="3" fill="#333333" />
        
        {/* Nose */}
        <circle cx="50" cy="68" r="2" fill="#333333" />
      </svg>
      <div className="flex flex-col">
        <span className="text-2xl font-bold tracking-tight text-auburn leading-none">PixelPaws</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-charcoal/60 font-medium">Smarter Image Magic</span>
      </div>
    </div>
  );
};
