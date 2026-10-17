import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useCountUp } from "../../lib/motion";
import { REVENUE_MASK, formatNaira, resolveRevenue } from "../../utils/revenueDisplay";

/**
 * Net-sales figure for the admin dashboard.
 *
 * - Masked on first paint (`****.***`) unless the admin turned that off.
 * - Eye button reveals / re-hides the number; the choice is not persisted, so
 *   a reload goes back to masked.
 * - When a manual figure is set in Settings > Revenue privacy, that figure is
 *   displayed and a red dot marks it as not being the ledger total.
 */
export default function RevenueValue({ amount, display, symbol = "\u20A6", className = "" }) {
    const resolved = resolveRevenue(amount, display);
    // null = follow the stored preference; true/false = this visit's choice.
    const [revealChoice, setRevealChoice] = useState(null);
    const revealed = revealChoice ?? !resolved.hideByDefault;

    // 0 while masked so the tween replays from zero when the admin reveals it.
    const countRef = useCountUp(revealed ? resolved.value : 0);

    return (
        <span className={`inline-flex items-end gap-3 ${className}`}>
            {revealed ? (
                <span
                    className="text-[42px] md:text-[56px] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-[#EDEAE2]"
                >
                    <span className="text-xl text-[#EDEAE2]/55 font-semibold">{symbol}</span>
                    <span ref={countRef}>0</span>
                </span>
            ) : (
                <span
                    aria-label="Revenue hidden"
                    className="text-[42px] md:text-[56px] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-[#EDEAE2]"
                >
                    {REVENUE_MASK}
                </span>
            )}

            {resolved.isOverride && revealed && (
                <span
                    role="img"
                    aria-label="Manually set figure"
                    title={`Manually set figure. Ledger total: ${formatNaira(resolved.ledger, symbol)}`}
                    className="mb-2 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]"
                />
            )}

            <button
                type="button"
                onClick={() => setRevealChoice(!revealed)}
                aria-label={revealed ? "Hide revenue figure" : "Reveal revenue figure"}
                aria-pressed={revealed}
                className="focus-ring mb-2 inline-flex items-center justify-center rounded-lg p-1.5 text-[#EDEAE2]/45 transition-colors hover:bg-white/[0.08] hover:text-[#EDEAE2]"
            >
                {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </span>
    );
}
