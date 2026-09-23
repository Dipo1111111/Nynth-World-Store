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
                    "border-transparent bg-rose-50 text-rose-600 border-rose-100",
                outline: "text-foreground",
                success:
                    "border-transparent bg-emerald-50 text-emerald-700 border-emerald-100",
                warning:
                    "border-transparent bg-amber-50 text-amber-700 border-amber-100",
                info:
                    "border-transparent bg-sky-50 text-sky-700 border-sky-100",
                neutral:
                    "border-transparent bg-slate-100 text-slate-600 border-slate-200",
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
