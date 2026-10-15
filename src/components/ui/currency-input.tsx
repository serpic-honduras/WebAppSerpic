import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | null | undefined;
  onChange: (value: number) => void;
  decimals?: number;
  allowNegative?: boolean;
}

const groupInteger = (intStr: string) => intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const formatWhileTyping = (raw: string, decimals: number, allowNegative: boolean): string => {
  if (raw == null) return "";
  // Keep only digits, dot, and optionally leading "-"
  let cleaned = String(raw).replace(/,/g, "");
  let negative = false;
  if (allowNegative && cleaned.trim().startsWith("-")) {
    negative = true;
    cleaned = cleaned.replace(/-/g, "");
  } else {
    cleaned = cleaned.replace(/-/g, "");
  }
  cleaned = cleaned.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  let intPart = parts[0].replace(/^0+(?=\d)/, "");
  if (intPart === "") intPart = parts.length > 1 ? "0" : "";
  let decPart = parts.length > 1 ? parts.slice(1).join("").slice(0, decimals) : undefined;

  let out = intPart === "" ? "" : groupInteger(intPart);
  if (decPart !== undefined) out += "." + decPart;
  if (negative && out !== "") out = "-" + out;
  return out;
};

const parseClean = (display: string): number => {
  if (display == null || display === "" || display === "-") return 0;
  const n = parseFloat(display.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const formatBlur = (n: number, decimals: number): string =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/**
 * Numeric input with live thousands-separator formatting.
 * Emits the clean numeric value via onChange.
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    { value, onChange, decimals = 2, allowNegative = false, className, onBlur, onFocus, disabled, ...rest },
    ref,
  ) => {
    const [display, setDisplay] = React.useState<string>(() =>
      value == null || Number.isNaN(Number(value)) ? "" : formatBlur(Number(value), decimals),
    );
    const [focused, setFocused] = React.useState(false);

    // Keep display in sync when external value changes and the field is not focused.
    React.useEffect(() => {
      if (focused) return;
      const next =
        value == null || value === 0
          ? value === 0
            ? formatBlur(0, decimals)
            : ""
          : formatBlur(Number(value), decimals);
      setDisplay(next);
    }, [value, decimals, focused]);

    return (
      <Input
        {...rest}
        ref={ref}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        className={cn(className)}
        value={display}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onChange={(e) => {
          const formatted = formatWhileTyping(e.target.value, decimals, allowNegative);
          setDisplay(formatted);
          onChange(parseClean(formatted));
        }}
        onBlur={(e) => {
          const n = parseClean(display);
          setDisplay(display === "" ? "" : formatBlur(n, decimals));
          setFocused(false);
          onBlur?.(e);
        }}
      />
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;
