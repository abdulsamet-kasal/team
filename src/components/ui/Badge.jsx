import React from "react";

export default function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className = "",
  title
}) {
  const sizeClasses = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs"
  };

  const variantClasses = {
    default:
      "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]",
    purple:
      "bg-purple-500/15 text-purple-300 border border-purple-500/30",
    accent:
      "bg-purple-600/15 text-purple-300 border border-purple-500/30",
    success:
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warning:
      "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    danger:
      "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    info:
      "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    mono:
      "font-mono bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)]"
  };

  const dotClasses = {
    default: "bg-zinc-400",
    purple: "bg-purple-400",
    accent: "bg-purple-400",
    success: "bg-emerald-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    info: "bg-sky-400",
    mono: "bg-zinc-400"
  };

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 font-medium rounded-md select-none ${sizeClasses[size] || sizeClasses.sm} ${variantClasses[variant] || variantClasses.default} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses[variant] || "bg-zinc-400"}`}
        />
      )}
      {children}
    </span>
  );
}
