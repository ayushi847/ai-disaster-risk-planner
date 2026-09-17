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
 * with 1-Click Direct Phone Calling and Pre-Drafted SOS SMS dispatch.
 */
const AuthorityHelplinePanel = ({
  locationItem = {},
  compact = false,
  title = "Nearest Emergency Authorities & SOS Dispatch",
  showHeading = true,
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

  return (
    <div className={`rounded-xl border border-rose-500/20 bg-gradient-to-b from-slate-900/95 to-slate-950/95 shadow-lg ${compact ? "p-3" : "p-4"} backdrop-blur-md`}>
      {/* Header */}
      {showHeading && (
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1.5">
              🚨 {title}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
            {locationItem.district ? `${locationItem.district} Sector` : "Geo-Dispatched"}
          </span>
        </div>
      )}

      {/* Authority Cards Grid */}
      <div className="space-y-2.5">
        {authorities.map((auth) => {
          const smsText = generateEmergencySmsTemplate(auth, locationItem);
          const smsHref = getSmsUri(auth.phone, smsText);
          const callHref = getCallUri(auth.phone);
          const isPreviewOpen = selectedPreviewAuth?.id === auth.id;

          return (
            <div
              key={auth.id}
              className="rounded-lg border border-slate-800 bg-slate-900/80 hover:border-slate-700 p-2.5 transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Authority Information */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white tracking-wide truncate max-w-[260px]">
                      {auth.name}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                        auth.badge?.includes("112")
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : auth.badge?.includes("DEOC")
                          ? "bg-rose-500/10 text-rose-300 border-rose-500/30"
                          : auth.badge?.includes("NDRF")
                          ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                          : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                      }`}
                    >
                      {auth.badge || "DEOC"}
                    </span>
                    {auth.available24x7 && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                        24x7
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-2">
                    <span>{auth.department}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-slate-300">{auth.displayPhone || auth.phone}</span>
                  </div>
                </div>

                {/* Side-by-Side Action Buttons: CALL and SMS */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* CALL BUTTON */}
                  <a
                    href={callHref}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-all duration-150"
                    title={`Direct Call: ${auth.phone}`}
                  >
                    <span>📞</span>
                    <span>Call</span>
                  </a>

                  {/* SMS SOS BUTTON */}
                  <a
                    href={smsHref}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-all duration-150"
                    title="Send Pre-Drafted SOS SMS"
                  >
                    <span>💬</span>
                    <span>Send SMS</span>
                  </a>

                  {/* Copy / Preview Toggle */}
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewAuth(isPreviewOpen ? null : auth)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 text-xs transition-colors"
                    title="View / Copy Pre-drafted Template"
                  >
                    {isPreviewOpen ? "▲" : "📋"}
                  </button>
                </div>
              </div>

              {/* Collapsible SMS Preview & WhatsApp Copy Box */}
              {isPreviewOpen && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-1.5">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      📱 Pre-Drafted SMS Template (Ready to Dispatch)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(auth, e)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-medium text-[11px] border border-slate-700 flex items-center gap-1 transition-colors"
                    >
                      {copiedId === auth.id ? "✓ Copied!" : "Copy Report"}
                    </button>
                  </div>
                  <pre className="p-2 rounded bg-black/50 text-slate-300 font-mono text-[11px] whitespace-pre-wrap leading-relaxed border border-slate-850 select-all overflow-x-auto">
                    {smsText}
                  </pre>
                  <p className="text-[10px] text-slate-400 mt-1.5 italic">
                    💡 Tapping "Send SMS" opens your device's SMS app with this message pre-filled. You just need to tap Send.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Universal Quick Dispatch Note */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          🛡️ Emergency Dial: <a href="tel:112" className="text-amber-400 font-bold hover:underline">112 (ERSS)</a> | <a href="tel:1078" className="text-cyan-400 font-bold hover:underline">1078 (NDMA)</a>
        </span>
        <span className="text-[10px] text-slate-400">Geo-coordinates & GPS pin attached to SMS</span>
      </div>
    </div>
  );
};

export default AuthorityHelplinePanel;
