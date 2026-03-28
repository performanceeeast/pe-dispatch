export const TECHS = [
  { id: "jake", name: "Jake", specialty: "Marine / Watercraft", color: "#2563eb" },
  { id: "tyler", name: "Tyler", specialty: "Marine PDI / Electrical", color: "#7c3aed" },
  { id: "danny", name: "Danny", specialty: "Offroad / Engine Work", color: "#dc2626" },
  { id: "ray", name: "Ray", specialty: "Offroad / Diagnostics", color: "#ea580c" },
  { id: "cody", name: "Cody", specialty: "Offroad / Accessories", color: "#0d9488" },
];

export const PRIORITIES = {
  P1: { label: "P1 — Critical", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  P2: { label: "P2 — High", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
  P3: { label: "P3 — Normal", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  P4: { label: "P4 — Low", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
};

export const STATUSES = {
  NOT_STARTED: { label: "Not Started", color: "#6b7280", bg: "#f3f4f6", icon: "○" },
  IN_PROGRESS: { label: "In Progress", color: "#2563eb", bg: "#dbeafe", icon: "◐" },
  ON_HOLD: { label: "On Hold", color: "#d97706", bg: "#fef3c7", icon: "⏸" },
  WAITING_PARTS: { label: "Waiting Parts", color: "#9333ea", bg: "#f3e8ff", icon: "📦" },
  COMPLETED: { label: "Completed", color: "#16a34a", bg: "#dcfce7", icon: "✓" },
};

export const UNIT_TYPES = ["OFFROAD", "WATERCRAFT"];

export const JOB_TYPES = [
  "CUSTOMER PAY", "WARRANTY REPAIR", "AFTERMARKET WARRANTY", "INSURANCE CLAIM",
  "SETUP/PDI", "ACCESSORY INSTALL", "ENGINE WORK", "ELECTRICAL", "DIAG",
  "FABRICATION/WELDING", "UPHOLSTERY/COSMETIC", "COMEBACK", "SERVICE", "FULL SERVICE",
];

export const SKILL_LEVELS = ["BASIC", "INTERMEDIATE", "ADVANCED", "SPECIALIST"];

export const FLAT_RATE_OPTS = [
  "LOW (<2 HRS)", "MEDIUM (2-4 HRS)", "HIGH (4+ HRS)", "FLAT RATE", "N/A", "NONE",
];

export const PARTS_STATUSES = [
  "ALL PARTS IN", "SOME PARTS IN", "WAITING FOR PARTS", "NOT ORDERED YET", "NO PARTS",
];
