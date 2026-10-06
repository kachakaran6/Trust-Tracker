import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  badge?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  label,
  searchable = false,
  searchPlaceholder = "Search...",
  className = "",
  disabled = false,
  size = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen, searchable]);

  const filteredOptions = searchable && search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase()) ||
          o.description?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs rounded-sm",
    md: "px-3.5 py-2 text-sm rounded-sm",
    lg: "px-4 py-2.5 text-base rounded-sm",
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs sm:text-sm font-medium text-[var(--text)] mb-1.5">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] shadow-sm hover:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 transition-colors cursor-pointer ${
          sizeClasses[size]
        } ${disabled ? "opacity-50 cursor-not-allowed bg-[var(--surface-muted)]" : ""}`}
      >
        <div className="flex items-center gap-2 truncate text-left">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate font-medium">
            {selectedOption ? selectedOption.label : <span className="text-[var(--text-muted)]">{placeholder}</span>}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-150 shrink-0 ${
            isOpen ? "rotate-180 text-[var(--primary)]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-[var(--surface)] border border-[var(--border)] rounded-sm shadow-md overflow-hidden animate-in fade-in-50 duration-100">
          {searchable && (
            <div className="p-2 border-b border-[var(--border)]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto p-1 divide-y divide-[var(--border)]">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-[var(--text-muted)]">No matching options</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs sm:text-sm rounded-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold"
                        : "text-[var(--text)] hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <p className="truncate">{opt.label}</p>
                        {opt.description && (
                          <p className="text-[10px] text-[var(--text-muted)] font-normal truncate">{opt.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-muted)] text-[var(--text-muted)] font-mono">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-[var(--primary)]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
