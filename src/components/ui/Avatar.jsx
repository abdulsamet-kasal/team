import React from "react";

export const BOT_COLORS = {
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    ring: "ring-purple-500/40"
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    ring: "ring-blue-500/40"
  },
  green: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    ring: "ring-emerald-500/40"
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    ring: "ring-cyan-500/40"
  },
  red: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-400",
    ring: "ring-rose-500/40"
  },
  yellow: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    ring: "ring-amber-500/40"
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    ring: "ring-amber-500/40"
  },
  pink: {
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
    text: "text-pink-400",
    ring: "ring-pink-500/40"
  },
  default: {
    bg: "bg-[var(--bg-surface-elevated)]",
    border: "border-[var(--border-default)]",
    text: "text-[var(--text-primary)]",
    ring: "ring-zinc-500/30"
  }
};

export default function Avatar({
  avatar = "🤖",
  color = "default",
  status = null, // 'idle', 'thinking', 'working', 'error'
  size = "md",
  className = "",
  showStatus = false
}) {
  const colorScheme = BOT_COLORS[color] || BOT_COLORS.default;

  const sizeClasses = {
    xs: "w-5 h-5 text-[11px] rounded-md",
    sm: "w-7 h-7 text-xs rounded-lg",
    md: "w-8 h-8 text-sm rounded-lg",
    lg: "w-10 h-10 text-base rounded-xl"
  };

  const statusDotSizes = {
    xs: "w-1.5 h-1.5 -bottom-0.5 -right-0.5",
    sm: "w-2 h-2 -bottom-0.5 -right-0.5",
    md: "w-2.5 h-2.5 -bottom-1 -right-1",
    lg: "w-3 h-3 -bottom-1 -right-1"
  };

  const getStatusColor = () => {
    switch (status) {
      case "working":
        return "bg-amber-400 animate-pulse ring-2 ring-[var(--bg-base)]";
      case "thinking":
        return "bg-sky-400 animate-ping ring-2 ring-[var(--bg-base)]";
      case "error":
        return "bg-rose-500 ring-2 ring-[var(--bg-base)]";
      case "idle":
        return "bg-emerald-400 ring-2 ring-[var(--bg-base)]";
      default:
        return "bg-zinc-500 ring-2 ring-[var(--bg-base)]";
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} ${colorScheme.bg} ${colorScheme.border} border flex items-center justify-center font-medium shadow-xs`}
      >
        <span>{avatar}</span>
      </div>

      {showStatus && status && (
        <span
          className={`absolute rounded-full ${statusDotSizes[size] || statusDotSizes.md} ${getStatusColor()}`}
        />
      )}
    </div>
  );
}
