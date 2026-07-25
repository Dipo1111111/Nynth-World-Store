import { useSettings } from "../../context/SettingsContext";

export default function Marquee() {
  const { settings } = useSettings();

  if (!settings?.marquee_enabled || !settings?.marquee_text) return null;

  const text = settings.marquee_text;
  // Repeat enough times to fill the screen and create seamless loop
  const repeats = 8;

  return (
    <div className="w-full bg-red-600 text-white overflow-hidden py-2" role="marquee" aria-label="Promotional announcement">
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none !important; }
        }
      `}</style>
      <div className="marquee-track flex whitespace-nowrap" style={{ animation: 'marquee-scroll 30s linear infinite' }}>
        {Array.from({ length: repeats }).map((_, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-6 px-6 text-[8px] md:text-[9px] tracking-[0.4em] font-bold uppercase shrink-0"
          >
            <span>{text}</span>
            <span className="opacity-30">•</span>
          </span>
        ))}
        {/* Duplicate for seamless loop */}
        {Array.from({ length: repeats }).map((_, i) => (
          <span
            key={`dup-${i}`}
            className="inline-flex items-center gap-6 px-6 text-[8px] md:text-[9px] tracking-[0.4em] font-bold uppercase shrink-0"
          >
            <span>{text}</span>
            <span className="opacity-30">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
