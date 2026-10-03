import React from "react";
import { Loader2 } from "lucide-react";

export default function Button({
  children,
  variant = "secondary",
  size = "md",
  icon: Icon,
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  title,
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  const sizeClasses = {
    xs: "px-2 py-1 text-xs gap-1.5 h-6",
    sm: "px-2.5 py-1.5 text-xs gap-1.5 h-7",
    md: "px-3 py-1.5 text-xs font-medium gap-2 h-8",
    lg: "px-4 py-2 text-sm gap-2 h-9",
    icon: "p-1.5 h-8 w-8",
    "icon-sm": "p-1 h-7 w-7",
    "icon-xs": "p-0.5 h-6 w-6"
  };

  const variantClasses = {
    primary:
      "bg-purple-600 hover:bg-purple-500 text-white shadow-sm shadow-purple-600/20 active:scale-[0.98]",
    secondary:
      "bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] border border-[var(--border-default)] active:scale-[0.98]",
    ghost:
      "bg-transparent hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
    danger:
      "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50",
    "danger-solid":
      "bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-600/30 active:scale-[0.98]",
    success:
      "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    purple:
      "bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30",
    outline:
      "bg-transparent hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]"
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${variantClasses[variant] || variantClasses.secondary} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
