import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus-ring",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground",
                destructive:
                    "border-[var(--tint-rose-line)] bg-[var(--tint-rose-bg)] text-[var(--tint-rose-fg)]",
                outline: "text-foreground",
                success:
                    "border-[var(--tint-emerald-line)] bg-[var(--tint-emerald-bg)] text-[var(--tint-emerald-fg)]",
                warning:
                    "border-[var(--tint-amber-line)] bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)]",
                info:
                    "border-[var(--tint-sky-line)] bg-[var(--tint-sky-bg)] text-[var(--tint-sky-fg)]",
                neutral:
                    "border-[var(--tint-slate-line)] bg-[var(--tint-slate-bg)] text-[var(--tint-slate-fg)]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function Badge({ className, variant, ...props }) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    )
}

export { Badge, badgeVariants }
