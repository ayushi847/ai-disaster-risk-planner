import React, { useState, useMemo } from "react";
import {
  getNearestAuthorities,
  generateEmergencySmsTemplate,
  getSmsUri,
  getCallUri,
  copyToClipboard
} from "../../utils/authorityHelplines";

/**
 * AuthorityHelplinePanel Component
 * Renders nearest emergency response authorities (DDMA, SDMA, NDRF, 112)
 * with robust, pixel-perfect inline layout & 1-Click Call / Pre-Drafted SOS SMS dispatch.
 */
const AuthorityHelplinePanel = ({
  locationItem = {},
  compact = false,
  title = "Nearest Emergency Response Helplines",
  showHeading = true,
  theme = "light", // 'light' | 'dark'
  maxItems = 4
}) => {
  const [selectedPreviewAuth, setSelectedPreviewAuth] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const authorities = useMemo(() => {
    return getNearestAuthorities(locationItem).slice(0, maxItems);
  }, [locationItem, maxItems]);

  const handleCopy = async (auth, e) => {
    e.stopPropagation();
    const message = generateEmergencySmsTemplate(auth, locationItem);
    const success = await copyToClipboard(message);
    if (success) {
      setCopiedId(auth.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  if (!authorities || authorities.length === 0) {
    return null;
  }

  const isDark = theme === "dark";

  // Container styling
  const containerStyle = {
    background: isDark ? "#0f172a" : "#ffffff",
    border: isDark ? "1px solid #1e293b" : "1px solid #fecaca",
    borderRadius: "10px",
    padding: compact ? "10px 12px" : "14px",
    boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.3)" : "0 2px 8px rgba(239, 68, 68, 0.08)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    boxSizing: "border-box",
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      {showHeading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "10px",
            paddingBottom: "8px",
            borderBottom: isDark ? "1px solid #1e293b" : "1px solid #fee2e2",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ fontSize: "15px" }}>🚨</span>
            <span
              style={{
                fontSize: "12px",
                fontWeight: "800",
                color: isDark ? "#f87171" : "#b91c1c",
                letterSpacing: "0.3px",
                textTransform: "uppercase",
              }}
            >
              {title}
            </span>
          </div>

          <span
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: isDark ? "#94a3b8" : "#64748b",
              background: isDark ? "#1e293b" : "#f1f5f9",
              padding: "2px 8px",
              borderRadius: "12px",
              border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
            }}
          >
            {locationItem.district ? `${locationItem.district} Sector` : "Geo-Dispatched"}
          </span>
        </div>
      )}

      {/* Authorities List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {authorities.map((auth) => {
          const smsText = generateEmergencySmsTemplate(auth, locationItem);
          const smsHref = getSmsUri(auth.phone, smsText);
          const callHref = getCallUri(auth.phone);
          const isPreviewOpen = selectedPreviewAuth?.id === auth.id;

          return (
            <div
              key={auth.id}
              style={{
                background: isDark ? "#1e293b" : "#f8fafc",
                border: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "9px 11px",
                transition: "all 0.15s ease",
              }}
            >
              {/* Top Row: Authority Details & Action Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {/* Authority Information */}
                <div style={{ minWidth: "200px", flex: "1 1 200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: isDark ? "#f1f5f9" : "#0f172a",
                        lineHeight: "1.3",
                      }}
                    >
                      {auth.name}
                    </span>

                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "700",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        border: "1px solid",
                        background: auth.badge?.includes("112")
                          ? (isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7")
                          : auth.badge?.includes("DEOC")
                          ? (isDark ? "rgba(244, 63, 94, 0.15)" : "#ffe4e6")
                          : auth.badge?.includes("NDRF")
                          ? (isDark ? "rgba(99, 102, 241, 0.15)" : "#e0e7ff")
                          : (isDark ? "rgba(6, 182, 212, 0.15)" : "#cffafe"),
                        borderColor: auth.badge?.includes("112")
                          ? "#f59e0b"
                          : auth.badge?.includes("DEOC")
                          ? "#f43f5e"
                          : auth.badge?.includes("NDRF")
                          ? "#6366f1"
                          : "#06b6d4",
                        color: auth.badge?.includes("112")
                          ? (isDark ? "#fbbf24" : "#b45309")
                          : auth.badge?.includes("DEOC")
                          ? (isDark ? "#fb7185" : "#be123c")
                          : auth.badge?.includes("NDRF")
                          ? (isDark ? "#818cf8" : "#4338ca")
                          : (isDark ? "#22d3ee" : "#0e7490"),
                      }}
                    >
                      {auth.badge || "DEOC"}
                    </span>

                    {auth.available24x7 && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          color: isDark ? "#34d399" : "#059669",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          fontFamily: "monospace",
                        }}
                      >
                        <span
                          style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            background: isDark ? "#34d399" : "#059669",
                            display: "inline-block",
                          }}
                        />
                        24x7
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginTop: "3px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{auth.department}</span>
                    <span style={{ color: isDark ? "#475569" : "#cbd5e1" }}>•</span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: "700",
                        color: isDark ? "#38bdf8" : "#0369a1",
                      }}
                    >
                      📞 {auth.displayPhone || auth.phone}
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Action Buttons: CALL & SMS */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexWrap: "wrap",
                    marginLeft: "auto",
                  }}
                >
                  {/* CALL BUTTON */}
                  <a
                    href={callHref}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "#059669",
                      color: "#ffffff",
                      padding: "5px 11px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      textDecoration: "none",
                      boxShadow: "0 2px 4px rgba(5, 150, 105, 0.25)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                    title={`Call ${auth.name} directly (${auth.phone})`}
                  >
                    <span>📞</span>
                    <span>Call</span>
                  </a>

                  {/* SMS SOS BUTTON */}
                  <a
                    href={smsHref}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "linear-gradient(135deg, #0284c7, #2563eb)",
                      color: "#ffffff",
                      padding: "5px 11px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      textDecoration: "none",
                      boxShadow: "0 2px 4px rgba(2, 132, 199, 0.25)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                    title="Open SMS app with ready-to-send SOS template"
                  >
                    <span>💬</span>
                    <span>Send SMS</span>
                  </a>

                  {/* PREVIEW / COPY TEMPLATE TOGGLE */}
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewAuth(isPreviewOpen ? null : auth)}
                    style={{
                      padding: "5px 7px",
                      borderRadius: "6px",
                      background: isDark ? "#334155" : "#e2e8f0",
                      border: isDark ? "1px solid #475569" : "1px solid #cbd5e1",
                      color: isDark ? "#f1f5f9" : "#334155",
                      fontSize: "11px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                    title="View & copy pre-drafted message"
                  >
                    <span>{isPreviewOpen ? "▲" : "📋"}</span>
                  </button>
                </div>
              </div>

              {/* Collapsible SMS Preview Box */}
              {isPreviewOpen && (
                <div
                  style={{
                    marginTop: "8px",
                    paddingTop: "8px",
                    borderTop: isDark ? "1px solid #334155" : "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "5px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: isDark ? "#cbd5e1" : "#334155",
                      }}
                    >
                      📱 Pre-Drafted SOS Message (Ready to Send):
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleCopy(auth, e)}
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: copiedId === auth.id ? "#059669" : (isDark ? "#334155" : "#e2e8f0"),
                        color: copiedId === auth.id ? "#ffffff" : (isDark ? "#38bdf8" : "#0284c7"),
                        border: "none",
                        fontSize: "10.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      {copiedId === auth.id ? "✓ Copied!" : "Copy Report"}
                    </button>
                  </div>

                  <pre
                    style={{
                      margin: 0,
                      padding: "8px",
                      borderRadius: "6px",
                      background: isDark ? "#090d16" : "#ffffff",
                      border: isDark ? "1px solid #1e293b" : "1px solid #cbd5e1",
                      color: isDark ? "#e2e8f0" : "#1e293b",
                      fontFamily: "monospace",
                      fontSize: "10.5px",
                      lineHeight: "1.4",
                      whiteSpace: "pre-wrap",
                      userSelect: "all",
                      overflowX: "auto",
                    }}
                  >
                    {smsText}
                  </pre>
                  <div
                    style={{
                      fontSize: "10px",
                      color: isDark ? "#94a3b8" : "#64748b",
                      fontStyle: "italic",
                      marginTop: "4px",
                    }}
                  >
                    💡 Tapping "Send SMS" opens your phone's SMS app with this message pre-filled. You just tap Send.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Universal Quick Dial Footer */}
      <div
        style={{
          marginTop: "10px",
          paddingTop: "7px",
          borderTop: isDark ? "1px solid #1e293b" : "1px solid #fee2e2",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "6px",
          fontSize: "11px",
          color: isDark ? "#94a3b8" : "#64748b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
          <span>🛡️ Universal Helpline:</span>
          <a
            href="tel:112"
            style={{
              color: "#d97706",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            112 (ERSS)
          </a>
          <span>|</span>
          <a
            href="tel:1078"
            style={{
              color: "#0284c7",
              fontWeight: "700",
              textDecoration: "none",
            }}
          >
            1078 (NDMA)
          </a>
        </div>
        <span style={{ fontSize: "10px", color: isDark ? "#64748b" : "#94a3b8" }}>
          Geo-coordinates & map pin attached
        </span>
      </div>
    </div>
  );
};

export default AuthorityHelplinePanel;
