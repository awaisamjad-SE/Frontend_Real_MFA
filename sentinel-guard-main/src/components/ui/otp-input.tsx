import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  className,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Update internal state when value prop changes
    const newOtp = value.split("").slice(0, length);
    while (newOtp.length < length) newOtp.push("");
    setOtp(newOtp);
  }, [value, length]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Only allow numbers
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otp];
    
    // Handle paste
    if (val.length > 1) {
      const pasteData = val.split("").slice(0, length);
      for (let i = 0; i < pasteData.length; i++) {
        if (index + i < length) {
          newOtp[index + i] = pasteData[i];
        }
      }
      setOtp(newOtp);
      onChange(newOtp.join(""));
      
      // Focus on the next empty input or the last one
      const nextIndex = Math.min(index + pasteData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = val;
    setOtp(newOtp);
    onChange(newOtp.join(""));

    // Move to next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={handleFocus}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-xl font-semibold rounded-lg",
            "bg-secondary/50 border border-border",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            digit && "border-primary bg-primary/10"
          )}
        />
      ))}
    </div>
  );
}
