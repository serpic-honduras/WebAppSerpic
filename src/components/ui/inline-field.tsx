import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface InlineFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  align?: "center" | "start";
  /** When true, input does not stretch to the right edge — fields cluster to the left. */
  leftAligned?: boolean;
  children: React.ReactNode;
}

/**
 * Renders a label and its input on the same horizontal line for compact forms.
 * On mobile collapses to a column.
 */
export const InlineField = ({
  label,
  htmlFor,
  required,
  className,
  labelClassName,
  align = "center",
  leftAligned = false,
  children,
}: InlineFieldProps) => {
  return (
    <div
      className={cn(
        "flex gap-3 w-full",
        align === "center" ? "items-center" : "items-start",
        "max-md:flex-col max-md:items-start max-md:gap-1",
        className
      )}
    >
      <Label
        htmlFor={htmlFor}
        className={cn(
          "w-56 shrink-0 text-sm font-medium text-foreground text-left",
          "max-md:w-auto",
          labelClassName
        )}
      >
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <div
        className={cn(
          "min-w-0",
          leftAligned ? "w-full md:w-auto md:flex-none md:max-w-md md:min-w-[20rem]" : "flex-1 w-full"
        )}
      >
        {children}
      </div>
    </div>
  );
};

export default InlineField;
