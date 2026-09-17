import { useState, useRef, useEffect, useMemo, useCallback } from "react";

// Color mapping for risk badges
const RISK_STYLES = {
  CRITICAL: {
    bg: "#fee2e2",
    text: "#991b1b",
    border: "#fca5a5",
    dot: "#ef4444",
  },
  HIGH: {
    bg: "#ffedd5",
    text: "#c2410c",
    border: "#fdba74",
    dot: "#f97316",
  },
  MEDIUM: {
    bg: "#fef9c3",
    text: "#a16207",
    border: "#fde047",
    dot: "#eab308",
  },
  LOW: {
    bg: "#dcfce7",
    text: "#15803d",
    border: "#86efac",
    dot: "#22c55e",
  },
};

const HAZARD_ICONS = {
  Flood: "🌊",
  "Flash Flood": "🌊",
  Landslide: "⛰️",
  Cyclone: "🌀",
  "Storm Surge": "🌀",
  "Ground Subsidence": "⛏️",
  Subsidence: "⛏️",
};

// Helper: highlight query text matches (supports multi-token matching)
const HighlightMatch = ({ text, query }) => {
  if (!text) return null;
  if (!query || !query.trim()) return <span>{text}</span>;

  const tokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (tokens.length === 0) return <span>{text}</span>;

  const regex = new RegExp(`(${tokens.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        tokens.some((t) => new RegExp(`^${t}$`, "i").test(part)) ? (
          <mark
            key={i}
            style={{
              background: "#fef08a",
              color: "#854d0e",
              padding: "0 2px",
              borderRadius: "2px",
              fontWeight: "700",
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

const SearchBar = ({
  villages = [],
  onSelectVillage,
  searchQuery = "",
  onSearchChange,
  placeholder = "Search habitation, district, hazard, state...",
}) => {
  const [internalQuery, setInternalQuery] = useState(searchQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Synchronize internal query with external query if provided
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== internalQuery) {
      setInternalQuery(searchQuery);
    }
  }, [searchQuery]);

  const query = internalQuery;

  // Global hotkey: "/" or "Cmd+K" / "Ctrl+K" focuses search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === "/" && document.activeElement !== inputRef.current && !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Multi-field intelligent search with relevance scoring
  const searchResults = useMemo(() => {
    if (!villages || villages.length === 0) return [];

    const q = query.trim().toLowerCase();
    if (!q) {
      // When empty and focused: show top critical / hotspot habitations as quick suggestions
      return villages
        .filter((v) => v.riskLevel === "CRITICAL" || v.riskLevel === "HIGH")
        .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
        .slice(0, 5);
    }

    const tokens = q.split(/\s+/).filter(Boolean);

    const scored = villages
      .map((v) => {
        const name = (v.name || "").toLowerCase();
        const district = (v.district || "").toLowerCase();
        const state = (v.state || "").toLowerCase();
        const hazard = (v.hazardType || "").toLowerCase();
        const risk = (v.riskLevel || "").toLowerCase();
        const id = (v.id || "").toLowerCase();

        // Check if all tokens match at least one field
        const matchesAll = tokens.every(
          (t) =>
            name.includes(t) ||
            district.includes(t) ||
            state.includes(t) ||
            hazard.includes(t) ||
            risk.includes(t) ||
            id.includes(t)
        );

        if (!matchesAll) return null;

        // Compute relevance score
        let score = 0;
        if (name === q) score += 120;
        else if (name.startsWith(q)) score += 80;
        else if (name.includes(q)) score += 50;

        if (district === q) score += 60;
        else if (district.startsWith(q)) score += 40;
        else if (district.includes(q)) score += 25;

        if (state.includes(q)) score += 20;
        if (hazard.includes(q)) score += 15;
        if (risk.includes(q)) score += 10;
        if (id.includes(q)) score += 15;

        // Factor in baseline hazard risk score (0-100)
        score += (v.riskScore || 0) * 0.1;

        return { village: v, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.village);

    return scored.slice(0, 12);
  }, [villages, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchResults]);

  // Keep highlighted item in view during arrow key navigation
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[selectedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInternalQuery(val);
    setIsOpen(true);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleSelect = useCallback(
    (village) => {
      if (!village) return;
      setInternalQuery(village.name);
      setIsOpen(false);
      setSelectedIndex(-1);
      if (onSearchChange) {
        onSearchChange(village.name);
      }
      if (onSelectVillage) {
        onSelectVillage(village);
      }
    },
    [onSelectVillage, onSearchChange]
  );

  const handleClear = () => {
    setInternalQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onSearchChange) {
      onSearchChange("");
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex]);
      } else if (searchResults.length > 0) {
        // Default to top match on Enter
        handleSelect(searchResults[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        zIndex: 1000,
      }}
    >
      {/* Input container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#ffffff",
          borderRadius: "8px",
          border: isOpen ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
          boxShadow: isOpen
            ? "0 0 0 3px rgba(37, 99, 235, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)"
            : "0 1px 3px rgba(0, 0, 0, 0.03)",
          transition: "all 0.15s ease",
          padding: "2px 8px",
          height: "34px",
          boxSizing: "border-box",
        }}
      >
        {/* Search icon */}
        <span
          style={{
            fontSize: "13px",
            marginRight: "6px",
            color: isOpen ? "#2563eb" : "#64748b",
            display: "flex",
            alignItems: "center",
            userSelect: "none",
          }}
        >
          🔍
        </span>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: "12px",
            background: "transparent",
            color: "#0f172a",
            fontWeight: "500",
            padding: "4px 0",
            minWidth: "60px",
          }}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={handleClear}
            style={{
              border: "none",
              background: "#f1f5f9",
              color: "#64748b",
              cursor: "pointer",
              fontSize: "11px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "4px",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            title="Clear search"
          >
            ✕
          </button>
        )}

        {/* Shortcut badge hint */}
        {!query && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: "600",
              color: "#94a3b8",
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: "4px",
              padding: "1px 5px",
              userSelect: "none",
              lineHeight: "1.2",
            }}
            title="Press / or ⌘K to search"
          >
            /
          </span>
        )}
      </div>

      {/* Dropdown Results Box */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "40px",
            left: "0",
            right: "0",
            minWidth: "340px",
            maxWidth: "480px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            zIndex: 10000,
            overflow: "hidden",
            animation: "searchFadeIn 0.15s ease-out",
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              padding: "7px 12px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "10.5px",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            <span>
              {query.trim()
                ? `${searchResults.length} habitation${searchResults.length === 1 ? "" : "s"} found`
                : "⚡ Critical & High Risk Hotspots"}
            </span>
            <span style={{ fontSize: "10px", color: "#94a3b8" }}>
              ↑↓ navigate · ↵ select · esc close
            </span>
          </div>

          {/* Results List */}
          {searchResults.length > 0 ? (
            <div
              ref={listRef}
              style={{
                maxHeight: "280px",
                overflowY: "auto",
              }}
            >
              {searchResults.map((village, idx) => {
                const isSelected = idx === selectedIndex;
                const riskStyle = RISK_STYLES[village.riskLevel] || {
                  bg: "#f1f5f9",
                  text: "#475569",
                  border: "#cbd5e1",
                  dot: "#94a3b8",
                };
                const hazardIcon = HAZARD_ICONS[village.hazardType] || "⚠️";

                return (
                  <div
                    key={village.id || idx}
                    onClick={() => handleSelect(village)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      background: isSelected ? "#eff6ff" : "#ffffff",
                      borderBottom: "1px solid #f8fafc",
                      borderLeft: isSelected
                        ? "3px solid #2563eb"
                        : "3px solid transparent",
                      transition: "background 0.1s, border-color 0.1s",
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    {/* Top line: Name + Badges */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          overflow: "hidden",
                        }}
                      >
                        <span style={{ fontSize: "12px", flexShrink: 0 }}>
                          {hazardIcon}
                        </span>
                        <strong
                          style={{
                            color: "#0f172a",
                            fontSize: "12px",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          <HighlightMatch text={village.name} query={query} />
                        </strong>
                      </div>

                      {/* Risk Badge */}
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: "9.5px",
                          fontWeight: "700",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          background: riskStyle.bg,
                          color: riskStyle.text,
                          border: `1px solid ${riskStyle.border}`,
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <span
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            background: riskStyle.dot,
                          }}
                        />
                        {village.riskLevel}
                      </span>
                    </div>

                    {/* Sub line: District, State, Hazard, Pop */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "11px",
                        color: "#64748b",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        📍{" "}
                        <HighlightMatch
                          text={`${village.district || "Unknown"}, ${village.state || "India"}`}
                          query={query}
                        />
                      </span>

                      <span>•</span>

                      <span style={{ color: "#475569", fontWeight: "500" }}>
                        <HighlightMatch
                          text={village.hazardType || "Hazard"}
                          query={query}
                        />
                      </span>

                      {village.population && (
                        <>
                          <span>•</span>
                          <span style={{ color: "#94a3b8" }}>
                            👥 {Number(village.population).toLocaleString()}
                          </span>
                        </>
                      )}

                      {village.riskScore !== undefined && (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: "10px",
                            fontWeight: "600",
                            color: "#475569",
                          }}
                        >
                          Score: {village.riskScore.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div
              style={{
                padding: "20px 16px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "6px" }}>🔍</div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#334155",
                }}
              >
                No habitations match &ldquo;{query}&rdquo;
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  marginTop: "4px",
                }}
              >
                Try searching by district (e.g. Chamoli, Wayanad), state, or hazard type (Flood, Landslide).
              </div>
              <button
                onClick={handleClear}
                style={{
                  marginTop: "10px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  fontWeight: "600",
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;