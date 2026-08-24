import React, { useRef, useEffect } from 'react';

interface ReturnOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  length?: number;
}

export const ReturnOtpInput: React.FC<ReturnOtpInputProps> = ({
  value,
  onChange,
  disabled = false,
  hasError = false,
  length = 6,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Focus the first empty input or the first input on mount
  useEffect(() => {
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const digits = value.split('');
  while (digits.length < length) {
    digits.push('');
  }

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const digit = rawVal.replace(/\D/g, '').slice(-1); // Only allow numeric

    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join('').slice(0, length);
    onChange(newValue);

    // If a digit was entered, move focus to the next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join('').slice(0, length));
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join('').slice(0, length));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[index] || ''}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`h-12 w-10 sm:h-14 sm:w-12 text-center text-xl sm:text-2xl font-black rounded-xl border bg-background text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            hasError
              ? 'border-destructive text-destructive bg-destructive/5'
              : digits[index]
              ? 'border-primary shadow-xs'
              : 'border-input hover:border-border'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          autoComplete="off"
        />
      ))}
    </div>
  );
};
