import React, { useState, useRef, useEffect } from "react";

export default function Popover({
  trigger,
  children,
  placement = "bottom-start", // 'bottom-start', 'bottom-end', 'top-start', 'top-end'
  className = "",
  isOpen: controlledIsOpen,
  onOpenChange
}) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  const toggle = () => {
    const nextState = !isOpen;
    if (!isControlled) setUncontrolledIsOpen(nextState);
    if (onOpenChange) onOpenChange(nextState);
  };

  const close = () => {
    if (!isControlled) setUncontrolledIsOpen(false);
    if (onOpenChange) onOpenChange(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        close();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const placementClasses = {
    "bottom-start": "top-full left-0 mt-2",
    "bottom-end": "top-full right-0 mt-2",
    "top-start": "bottom-full left-0 mb-2",
    "top-end": "bottom-full right-0 mb-2"
  };

  return (
    <div className="relative inline-block">
      <div ref={triggerRef} onClick={toggle}>
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute z-50 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            placementClasses[placement] || placementClasses["bottom-start"]
          } ${className}`}
        >
          {typeof children === "function" ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}
