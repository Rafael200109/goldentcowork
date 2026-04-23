import React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border-2 p-4 shadow-md [&>svg~*]:pl-10 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3 [&>svg]:h-6 [&>svg]:w-6",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--alert-orange))] text-primary-foreground border-[hsl(var(--alert-orange))]",
        destructive:
          "bg-[hsl(var(--alert-orange))] text-primary-foreground border-[hsl(var(--alert-orange))] [&>svg]:text-primary-foreground",
        success:
          "bg-[hsl(var(--alert-orange))] text-primary-foreground border-[hsl(var(--alert-orange))] [&>svg]:text-primary-foreground",
        warning:
          "bg-[hsl(var(--alert-orange))] text-primary-foreground border-[hsl(var(--alert-orange))] [&>svg]:text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight text-lg", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-base [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }