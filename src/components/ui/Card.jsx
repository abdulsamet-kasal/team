import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function Card({
  children,
  className = "",
  variant = "default",
  elevated = false,
  ...props
}) {
  const variantStyles = {
    default: "bg-[var(--bg-surface)] border-[var(--border-default)]",
    elevated: "bg-[var(--bg-surface-elevated)] border-[var(--border-default)] shadow-sm",
    terminal: "bg-[var(--code-bg)] border-[var(--border-default)] font-mono",
    warning: "bg-amber-950/20 border-amber-500/30",
    danger: "bg-rose-950/20 border-rose-500/30",
    purple: "bg-purple-950/20 border-purple-500/30"
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-150 ${variantStyles[variant] || variantStyles.default} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div
      className={`px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }) {
  return (
    <h3
      className={`text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "", ...props }) {
  return (
    <p
      className={`text-[11px] text-[var(--text-secondary)] ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`p-4 text-xs ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...props }) {
  return (
    <div
      className={`px-4 py-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-elevated)]/50 rounded-b-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CollapsibleCard({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  children,
  defaultOpen = false,
  className = "",
  headerClassName = "",
  contentClassName = ""
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden transition-all duration-150 ${className}`}
    >
      <div
        className={`px-3.5 py-2.5 flex items-center justify-between gap-2 select-none hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors ${headerClassName}`}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-0.5"
          >
            {open ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          {Icon && <Icon className="w-4 h-4 text-purple-400 shrink-0" />}

          <div className="min-w-0">
            <div className="text-xs font-semibold text-[var(--text-primary)] truncate flex items-center gap-2">
              {title}
              {badge}
            </div>
            {subtitle && (
              <div className="text-[11px] text-[var(--text-secondary)] truncate">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        {actions && (
          <div
            className="flex items-center gap-1.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>

      {open && (
        <div
          className={`border-t border-[var(--border-subtle)] p-3 text-xs ${contentClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default Card;
