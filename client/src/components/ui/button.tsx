import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-deep-slate disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 uppercase tracking-wide",
  {
    variants: {
      variant: {
        // Ember Gold - Primary CTA
        default: "bg-gradient-to-b from-ember to-[#E8890A] text-deep-slate border-2 border-[#FFB347] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_0_rgba(0,0,0,0.2),0_4px_12px_rgba(255,159,28,0.3)] hover:from-[#FFB347] hover:to-ember hover:shadow-[0_6px_20px_rgba(255,159,28,0.5),0_0_30px_rgba(255,159,28,0.3)] hover:-translate-y-0.5 active:translate-y-0.5",
        // Blood Rust - Destructive
        destructive:
          "bg-gradient-to-b from-[#A42A12] to-blood text-parchment border-2 border-[#B8341A] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_8px_rgba(141,35,15,0.4)] hover:from-[#B8341A] hover:to-[#A42A12] hover:shadow-[0_4px_16px_rgba(141,35,15,0.5)]",
        // Iron - Outline
        outline:
          "border-2 border-iron-gray bg-transparent text-parchment hover:bg-iron-gray/30 hover:border-ember/60",
        // Iron Gray - Secondary
        secondary:
          "bg-gradient-to-b from-[#4A4E57] to-iron-gray text-parchment border-2 border-[#5A5E67] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_8px_rgba(0,0,0,0.4)] hover:from-[#5A5E67] hover:to-[#4A4E57] hover:border-[#6A6E77]",
        // Ghost - Minimal
        ghost: "text-parchment/70 hover:text-parchment hover:bg-iron-gray/30",
        // Link - Text only
        link: "text-ember underline-offset-4 hover:underline hover:text-[#FFB347]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded px-3 text-xs",
        lg: "h-12 rounded px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
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
