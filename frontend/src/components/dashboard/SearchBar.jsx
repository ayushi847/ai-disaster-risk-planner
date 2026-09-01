import { useState } from "react";

const SearchBar = ({ villages, onSelectVillage }) => {
  const [query, setQuery] = useState("");

  const results = villages.filter((village) =>
    village.name
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  const handleSelect = (village) => {
    setQuery(village.name);
    onSelectVillage(village);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        padding: "3px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        zIndex: 9999,
      }}
    >
      <input
        type="text"
        placeholder="🔍 Search habitation..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "7px 10px",
          border: "none",
          outline: "none",
          borderRadius: "6px",
          fontSize: "12px",
          background: "transparent",
          color: "#1e293b",
        }}
      />

      {query && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "38px",
            left: "0",
            right: "0",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
            zIndex: 10000,
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {results.slice(0, 8).map((village) => (
            <div
              key={village.id}
              onClick={() => handleSelect(village)}
              style={{
                padding: "8px 10px",
                cursor: "pointer",
                background: "#ffffff",
                borderBottom: "1px solid #f1f5f9",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
            >
              <strong
                style={{
                  color: "#0f172a",
                  fontSize: "12px",
                }}
              >
                {village.name}
              </strong>

              <div
                style={{
                  fontSize: "10.5px",
                  color: "#64748b",
                  marginTop: "1px",
                }}
              >
                {village.district} · {village.riskLevel}
              </div>
            </div>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "38px",
            left: "0",
            right: "0",
            background: "#ffffff",
            padding: "8px 10px",
            border: "1px solid #e2e8f0",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            color: "#64748b",
            fontSize: "11px",
            zIndex: 10000,
          }}
        >
          No habitations found
        </div>
      )}
    </div>
  );
};

export default SearchBar;