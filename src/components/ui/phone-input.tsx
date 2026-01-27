import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  defaultCountryCode?: string;
}

// Format phone for display with mask
const formatPhoneDisplay = (value: string): string => {
  // Remove all non-digit characters except +
  const digits = value.replace(/[^\d+]/g, '');
  
  // If starts with +, keep it
  if (digits.startsWith('+')) {
    const cleanDigits = digits.substring(1).replace(/\D/g, '');
    
    // Format based on country code
    if (cleanDigits.startsWith('351')) {
      // Portuguese format: +351 XXX XXX XXX
      const rest = cleanDigits.substring(3);
      const parts = [
        rest.substring(0, 3),
        rest.substring(3, 6),
        rest.substring(6, 9)
      ].filter(Boolean);
      return `+351 ${parts.join(' ')}`.trim();
    } else if (cleanDigits.startsWith('55')) {
      // Brazilian format: +55 XX XXXXX-XXXX
      const rest = cleanDigits.substring(2);
      if (rest.length <= 2) {
        return `+55 ${rest}`;
      } else if (rest.length <= 7) {
        return `+55 ${rest.substring(0, 2)} ${rest.substring(2)}`;
      } else {
        return `+55 ${rest.substring(0, 2)} ${rest.substring(2, 7)}-${rest.substring(7, 11)}`;
      }
    } else {
      // Generic international format
      return `+${cleanDigits}`;
    }
  }
  
  // If just digits, assume Portuguese and format
  const cleanDigits = digits.replace(/\D/g, '');
  if (cleanDigits.length <= 3) {
    return cleanDigits;
  } else if (cleanDigits.length <= 6) {
    return `${cleanDigits.substring(0, 3)} ${cleanDigits.substring(3)}`;
  } else {
    return `${cleanDigits.substring(0, 3)} ${cleanDigits.substring(3, 6)} ${cleanDigits.substring(6, 9)}`;
  }
};

// Clean phone for storage (only digits with country code)
export const cleanPhoneForStorage = (value: string): string => {
  let digits = value.replace(/\D/g, '');
  
  // Remove leading 00
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }
  
  // If 8-9 digits starting with 9, add Portuguese code
  if ((digits.length === 8 || digits.length === 9) && digits.startsWith('9')) {
    digits = '351' + digits;
  }
  
  return digits;
};

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, defaultCountryCode = "+351", placeholder = "+351 912 345 678", ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(() => {
      if (value) {
        return formatPhoneDisplay(value.startsWith('+') ? value : `+${value}`);
      }
      return '';
    });

    React.useEffect(() => {
      if (value) {
        const formatted = formatPhoneDisplay(value.startsWith('+') ? value : `+${value}`);
        if (formatted !== displayValue) {
          setDisplayValue(formatted);
        }
      } else if (!displayValue) {
        setDisplayValue('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // If user clears input, reset
      if (!inputValue) {
        setDisplayValue('');
        onChange('');
        return;
      }
      
      // If first character and not + or digit, ignore
      if (inputValue.length === 1 && !/[\d+]/.test(inputValue)) {
        return;
      }
      
      // If user starts typing digits without +, add default country code
      if (!inputValue.startsWith('+') && /^\d/.test(inputValue)) {
        inputValue = defaultCountryCode + ' ' + inputValue;
      }
      
      // Format for display
      const formatted = formatPhoneDisplay(inputValue);
      setDisplayValue(formatted);
      
      // Send cleaned value to parent
      const cleaned = cleanPhoneForStorage(inputValue);
      onChange(cleaned);
    };

    const handleFocus = () => {
      // If empty, add default country code on focus
      if (!displayValue) {
        setDisplayValue(defaultCountryCode + ' ');
      }
    };

    const handleBlur = () => {
      // If only country code, clear
      if (displayValue === defaultCountryCode + ' ' || displayValue === defaultCountryCode) {
        setDisplayValue('');
        onChange('');
      }
    };

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        className={cn("font-mono", className)}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
