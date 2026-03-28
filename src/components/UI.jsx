import { PRIORITIES, STATUSES } from '../data/constants';

export function Badge({ children, color, bg, border, small }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: small ? "1px 6px" : "2px 8px",
      borderRadius: 4, fontSize: small ? 10 : 11, fontWeight: 600,
      color, backgroundColor: bg,
      border: `1px solid ${border || bg}`,
      letterSpacing: 0.3, whiteSpace: "nowrap",
      fontFamily: "'DM Mono', monospace",
    }}>{children}</span>
  );
}

export function PriorityBadge({ priority }) {
  const p = PRIORITIES[priority];
  return p ? <Badge color={p.color} bg={p.bg} border={p.border}>{priority}</Badge> : null;
}

export function StatusBadge({ status }) {
  const s = STATUSES[status];
  return s ? <Badge color={s.color} bg={s.bg}>{s.icon} {s.label}</Badge> : null;
}

export function PartsBadge({ partsStatus }) {
  const isGood = partsStatus === "ALL PARTS IN";
  const isWaiting = partsStatus === "WAITING FOR PARTS";
  const isNone = partsStatus === "NOT ORDERED YET";
  const color = isGood ? "#16a34a" : isWaiting ? "#9333ea" : isNone ? "#dc2626" : "#d97706";
  const bg = isGood ? "#dcfce7" : isWaiting ? "#f3e8ff" : isNone ? "#fef2f2" : "#fef3c7";
  return <Badge color={color} bg={bg} small>{partsStatus}</Badge>;
}

export function SelectField({ label, value, onChange, options, allowEmpty, emptyLabel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "'DM Mono', monospace" }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        padding: "6px 8px", borderRadius: 4, border: "1px solid #334155",
        background: "#1e293b", color: "#e2e8f0", fontSize: 12,
        fontFamily: "'DM Mono', monospace", cursor: "pointer", outline: "none",
      }}>
        {allowEmpty && <option value="">{emptyLabel || "All"}</option>}
        {options.map(o => typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
    </div>
  );
}

export function InputField({ label, value, onChange, type, placeholder, style: extraStyle }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, ...extraStyle }}>
      {label && <label style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "'DM Mono', monospace" }}>{label}</label>}
      <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          padding: "6px 8px", borderRadius: 4, border: "1px solid #334155",
          background: "#1e293b", color: "#e2e8f0", fontSize: 12,
          fontFamily: "'DM Mono', monospace", outline: "none",
        }} />
    </div>
  );
}
