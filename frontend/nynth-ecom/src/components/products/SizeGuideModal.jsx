import React from "react";
import { X, Ruler } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";

export default function SizeGuideModal({ onClose }) {
    const { settings } = useSettings();

    // Use settings data or fallback to defaults
    const sizeData = settings.size_chart_data && settings.size_chart_data.length > 0
        ? settings.size_chart_data
        : [
            { size: "XS", chest: "81-86", waist: "66-71", length: "68" },
            { size: "S", chest: "86-91", waist: "71-76", length: "70" },
            { size: "M", chest: "91-97", waist: "76-81", length: "72" },
            { size: "L", chest: "97-102", waist: "81-86", length: "74" },
            { size: "XL", chest: "102-107", waist: "86-91", length: "76" },
            { size: "XXL", chest: "107-112", waist: "91-97", length: "78" },
        ];

    const modelInfo = settings.size_chart_model_info || 
        "Our model is 185cm tall and wears a size M. NYNTH pieces are cut to an oversized silhouette — size down if you prefer a more fitted look.";

    return (
        <div
            className="fixed inset-0 z-[999] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white w-full max-w-lg md:rounded-none md:max-w-xl p-8 md:p-12 relative animate-slideUp max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Ruler size={14} className="text-gray-400" />
                            <span className="text-[9px] tracking-[0.3em] uppercase font-bold text-gray-400">NYNTH WORLD</span>
                        </div>
                        <h2 className="text-[18px] md:text-[22px] font-bold tracking-[0.15em] uppercase">Size Guide</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tip */}
                <p className="text-[10px] tracking-[0.15em] text-gray-500 uppercase mb-8 leading-relaxed font-medium">
                    All measurements are in <span className="text-black font-bold">centimetres (cm)</span>.
                    Measure your chest at the widest point and waist at the narrowest point.
                </p>

                {/* Size Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="py-3 pr-6 text-[9px] tracking-[0.25em] font-bold uppercase text-black">Size</th>
                                <th className="py-3 pr-6 text-[9px] tracking-[0.25em] font-bold uppercase text-black">Chest</th>
                                <th className="py-3 pr-6 text-[9px] tracking-[0.25em] font-bold uppercase text-black">Waist</th>
                                <th className="py-3 text-[9px] tracking-[0.25em] font-bold uppercase text-black">Length</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sizeData.map((row, i) => (
                                <tr key={i} className={`border-b border-black/5 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                                    <td className="py-4 pr-6 text-[10px] tracking-[0.15em] font-bold uppercase">{row.size}</td>
                                    <td className="py-4 pr-6 text-[10px] tracking-[0.1em] text-gray-600">{row.chest}</td>
                                    <td className="py-4 pr-6 text-[10px] tracking-[0.1em] text-gray-600">{row.waist}</td>
                                    <td className="py-4 text-[10px] tracking-[0.1em] text-gray-600">{row.length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Model Info */}
                <div className="mt-10 pt-8 border-t border-black/5">
                    <p className="text-[9px] tracking-[0.2em] uppercase text-gray-400 font-medium leading-relaxed">
                        {modelInfo}
                    </p>
                </div>
            </div>
        </div>
    );
}
