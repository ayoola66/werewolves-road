import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ember focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-ember to-[#E8890A] text-deep-slate shadow-[0_2px_8px_rgba(255,159,28,0.4)]",
        secondary:
          "border-iron-gray/50 bg-iron-gray/50 text-parchment",
        destructive:
          "border-transparent bg-gradient-to-r from-blood to-[#A42A12] text-parchment shadow-[0_2px_8px_rgba(141,35,15,0.4)]",
        outline: "border-iron-gray text-parchment/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
