import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded border-2 border-iron-gray bg-deep-slate/80 px-4 py-2 text-base text-parchment shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_1px_0_rgba(255,159,28,0.1)] transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-parchment placeholder:text-parchment/40 focus-visible:outline-none focus-visible:border-ember focus-visible:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),0_0_0_3px_rgba(255,159,28,0.15),0_0_20px_rgba(255,159,28,0.1)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
