import React from "react";

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = "",
  size = "sm"
}) {
  const sizeClasses = {
    sm: "text-xs py-1.5 px-3",
    md: "text-sm py-2 px-4"
  };

  return (
    <div
      className={`flex items-center gap-1 p-1 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 rounded-md font-medium transition-all duration-150 cursor-pointer ${sizeClasses[size] || sizeClasses.sm} ${
              isActive
                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs border border-[var(--border-subtle)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
            }`}
          >
            {Icon && (
              <Icon
                className={`w-3.5 h-3.5 ${isActive ? "text-purple-400" : "text-[var(--text-tertiary)]"}`}
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-purple-500/20 text-purple-300"
                    : "bg-[var(--bg-surface)] text-[var(--text-tertiary)]"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
