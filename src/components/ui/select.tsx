import * as React from "react";
import * as ReactDOM from "react-dom";
import { Button } from "./button";
import { Check as CheckIcon, ChevronDown } from "lucide-react";

interface SelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

interface SelectTriggerProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  position?: "popper" | "item-aligned";
}

interface SelectItemProps {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}

const SelectContext = React.createContext<{
  value?: string;
  onChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}>({
  value: undefined,
  onChange: () => {},
  open: false,
  setOpen: () => {},
  triggerRef: { current: null }
});

export const Select: React.FC<SelectProps> = ({ 
  value, 
  onValueChange, 
  disabled = false, 
  children 
}) => {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Close the dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [triggerRef]);

  return (
    <SelectContext.Provider value={{ value, onChange: onValueChange, open, setOpen, triggerRef }}>
      <div className="relative" aria-disabled={disabled}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ id, className = "", children }) => {
  const { open, setOpen, triggerRef, value } = React.useContext(SelectContext);

  return (
    <Button
      id={id}
      ref={triggerRef}
      type="button"
      variant="outline"
      className={`w-full justify-between font-normal ${className}`}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </Button>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);
  return <span>{(value && value !== "") ? value : placeholder}</span>;
};

export const SelectContent: React.FC<SelectContentProps> = ({ children, position = "item-aligned" }) => {
  const { open, triggerRef } = React.useContext(SelectContext);

  if (!open) return null;

  // Render dropdown directly without a portal
  return (
    <div 
      className="absolute z-50 top-full left-0 right-0 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-white text-foreground shadow-md animate-in fade-in-80"
    >
      <div className="p-1">{children}</div>
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps> = ({ value, disabled = false, children }) => {
  const { value: selectedValue, onChange, setOpen } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;

  function handleClick(e: React.MouseEvent) {
    // Stop propagation to prevent bubbling up to parent elements
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled) {
      console.log(`SelectItem clicked: ${value}`);
      // Call onChange with a slight delay to ensure it completes properly
      setTimeout(() => {
        onChange(value);
        setOpen(false);
      }, 0);
    }
  }

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      className={`relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none ${
        disabled ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-slate-100"
      } ${isSelected ? "bg-slate-100" : ""}`}
      onClick={handleClick}
      data-disabled={disabled}
      data-selected={isSelected}
      data-value={value}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="h-4 w-4" />}
      </span>
      <span className="truncate">{children}</span>
    </div>
  );
};