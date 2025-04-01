import * as React from "react";

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface DropdownMenuContentProps {
  align?: "start" | "end" | "center";
  children: React.ReactNode;
}

interface DropdownMenuItemProps {
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

// Simple dropdown menu component
export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  
  return (
    <div className="relative inline-block text-left">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any, any>, { open, setOpen });
        }
        return child;
      })}
    </div>
  );
};

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps & { open?: boolean; setOpen?: (open: boolean) => void }> = ({ 
  children, 
  asChild,
  open,
  setOpen 
}) => {
  // If we're using a child as the trigger, clone it and add onClick
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        setOpen?.(!open);
        
        // Also call the child's onClick if it exists
        if ((children as React.ReactElement<any>).props?.onClick) {
          (children as React.ReactElement<any>).props.onClick(e);
        }
      },
      "data-state": open ? "open" : "closed",
      "aria-expanded": open,
    });
  }
  
  return (
    <button 
      onClick={() => setOpen?.(!open)} 
      data-state={open ? "open" : "closed"}
      aria-expanded={open}
    >
      {children}
    </button>
  );
};

export const DropdownMenuContent: React.FC<DropdownMenuContentProps & { open?: boolean; setOpen?: (open: boolean) => void }> = ({ 
  children, 
  align = "end",
  open,
  setOpen
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setOpen?.(false);
      }
    };
    
    if (open) {
      // Add with a small delay to avoid immediate triggering
      setTimeout(() => {
        document.addEventListener("mousedown", handleOutsideClick);
      }, 0);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open, setOpen]);
  
  if (!open) return null;
  
  const alignClass = 
    align === "end" ? "right-0" : 
    align === "start" ? "left-0" : 
    "left-1/2 transform -translate-x-1/2";
  
  return (
    <div 
      ref={contentRef}
      className={`absolute z-[9999] mt-2 min-w-[8rem] w-auto rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${alignClass}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="py-1">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { 
              onItemClick: () => setOpen?.(false)
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

export const DropdownMenuItem: React.FC<DropdownMenuItemProps & { onItemClick?: () => void }> = ({ 
  children, 
  onClick,
  disabled = false,
  className = "",
  onItemClick
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!disabled) {
      if (onClick) {
        onClick();
      }
      if (onItemClick) {
        onItemClick();
      }
    }
  };
  
  return (
    <button
      className={`w-full text-left block px-4 py-2 text-sm ${
        disabled 
          ? "text-gray-400 cursor-not-allowed" 
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      } ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};