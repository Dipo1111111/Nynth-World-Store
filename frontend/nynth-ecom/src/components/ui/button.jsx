import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
    "focus-ring inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-card hover:-translate-y-0.5 hover:bg-primary hover:shadow-card-hover",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-card hover:-translate-y-0.5 hover:bg-destructive hover:shadow-card-hover",
                outline:
                    "border border-input bg-background shadow-sm hover:-translate-y-0.5 hover:border-black/40 hover:bg-accent hover:text-accent-foreground hover:shadow-card",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-secondary/80 hover:shadow-card",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-lg px-3",
                lg: "h-11 rounded-lg px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Button = React.forwardRef(
    ({ className, variant, size, ...props }, ref) => {
        // If we don't have Radix Slot installed, we fallback to just standard HTML button behavior for simplicity
        // But since cva/clsx are typically paired with Radix in shadcn, I'll assume standard button usage for now.
        // If @radix-ui/react-slot is missing, we can remove 'asChild' logic or install it.
        // For safety in this environment without installing new deps if possible, I will simplify.

        const Comp = "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
