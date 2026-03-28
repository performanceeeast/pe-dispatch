import { useState } from 'react';
import { TECHS, PRIORITIES, STATUSES, UNIT_TYPES, JOB_TYPES, SKILL_LEVELS, FLAT_RATE_OPTS, PARTS_STATUSES } from '../data/constants';
import { SelectField, InputField } from './UI';

export function AddJobModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    jobId: "", customer: "", unitType: "OFFROAD", jobType: "CUSTOMER PAY", jobDesc: "",
    skillNeeded: "INTERMEDIATE", flatRate: "MEDIUM (2-4 HRS)", partsStatus: "ALL PARTS IN",
    priority: "P2", assignedTech: "", status: "NOT_STARTED", estHours: "", notes: "",
    dateAdded: new Date().toISOString().split("T")[0],
  });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = () => {
    if (!form.jobId || !form.customer) return;
    onAdd({ ...form, estHours: parseFloat(form.estHours) || 0 });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0f172a", border: "1px solid #334155", borderRadius: 12,
        padding: 24, maxWidth: 600, width: "100%", maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: "#f1f5f9", fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 600, letterSpacing: 1, margin: 0 }}>ADD NEW JOB</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InputField label="RO / Job ID" value={form.jobId} onChange={v => upd("jobId", v)} placeholder="326XXX" />
          <InputField label="Customer" value={form.customer} onChange={v => upd("customer", v.toUpperCase())} placeholder="LAST NAME" />
          <SelectField label="Unit Type" value={form.unitType} onChange={v => upd("unitType", v)} options={UNIT_TYPES} />
          <SelectField label="Job Type" value={form.jobType} onChange={v => upd("jobType", v)} options={JOB_TYPES} />
          <div style={{ gridColumn: "1/-1" }}>
            <InputField label="Job Description" value={form.jobDesc} onChange={v => upd("jobDesc", v.toUpperCase())} placeholder="Describe the work" />
          </div>
          <SelectField label="Skill Needed" value={form.skillNeeded} onChange={v => upd("skillNeeded", v)} options={SKILL_LEVELS} />
          <SelectField label="Flat Rate" value={form.flatRate} onChange={v => upd("flatRate", v)} options={FLAT_RATE_OPTS} />
          <SelectField label="Parts Status" value={form.partsStatus} onChange={v => upd("partsStatus", v)} options={PARTS_STATUSES} />
          <SelectField label="Priority" value={form.priority} onChange={v => upd("priority", v)}
            options={Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label }))} />
          <SelectField label="Assign Tech" value={form.assignedTech} onChange={v => upd("assignedTech", v)}
            options={[{ value: "", label: "Unassigned" }, ...TECHS.map(t => ({ value: t.id, label: t.name }))]} />
          <SelectField label="Status" value={form.status} onChange={v => upd("status", v)}
            options={Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label }))} />
          <InputField label="Est. Hours" value={form.estHours} onChange={v => upd("estHours", v)} type="number" placeholder="0.0" />
          <InputField label="Date" value={form.dateAdded} onChange={v => upd("dateAdded", v)} type="date" />
          <div style={{ gridColumn: "1/-1" }}>
            <InputField label="Notes" value={form.notes} onChange={v => upd("notes", v.toUpperCase())} placeholder="Optional notes" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #475569", background: "transparent", color: "#94a3b8", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>CANCEL</button>
          <button onClick={handleSubmit} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>ADD JOB</button>
        </div>
      </div>
    </div>
  );
}

export function EditJobModal({ job, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...job, estHours: String(job.estHours || "") });
  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = () => {
    onSave(job.id, { ...form, estHours: parseFloat(form.estHours) || 0 });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0f172a", border: "1px solid #334155", borderRadius: 12,
        padding: 24, maxWidth: 600, width: "100%", maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ color: "#f1f5f9", fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 600, letterSpacing: 1, margin: 0 }}>EDIT JOB — {job.jobId}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InputField label="RO / Job ID" value={form.jobId} onChange={v => upd("jobId", v)} />
          <InputField label="Customer" value={form.customer} onChange={v => upd("customer", v.toUpperCase())} />
          <SelectField label="Unit Type" value={form.unitType} onChange={v => upd("unitType", v)} options={UNIT_TYPES} />
          <SelectField label="Job Type" value={form.jobType} onChange={v => upd("jobType", v)} options={JOB_TYPES} />
          <div style={{ gridColumn: "1/-1" }}>
            <InputField label="Job Description" value={form.jobDesc} onChange={v => upd("jobDesc", v.toUpperCase())} />
          </div>
          <SelectField label="Skill Needed" value={form.skillNeeded} onChange={v => upd("skillNeeded", v)} options={SKILL_LEVELS} />
          <SelectField label="Flat Rate" value={form.flatRate} onChange={v => upd("flatRate", v)} options={FLAT_RATE_OPTS} />
          <SelectField label="Parts Status" value={form.partsStatus} onChange={v => upd("partsStatus", v)} options={PARTS_STATUSES} />
          <SelectField label="Priority" value={form.priority} onChange={v => upd("priority", v)}
            options={Object.entries(PRIORITIES).map(([k, v]) => ({ value: k, label: v.label }))} />
          <SelectField label="Assign Tech" value={form.assignedTech} onChange={v => upd("assignedTech", v)}
            options={[{ value: "", label: "Unassigned" }, ...TECHS.map(t => ({ value: t.id, label: t.name }))]} />
          <SelectField label="Status" value={form.status} onChange={v => upd("status", v)}
            options={Object.entries(STATUSES).map(([k, v]) => ({ value: k, label: v.label }))} />
          <InputField label="Est. Hours" value={form.estHours} onChange={v => upd("estHours", v)} type="number" />
          <InputField label="Date" value={form.dateAdded} onChange={v => upd("dateAdded", v)} type="date" />
          <div style={{ gridColumn: "1/-1" }}>
            <InputField label="Notes" value={form.notes} onChange={v => upd("notes", v.toUpperCase())} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "space-between" }}>
          <button onClick={() => { if (confirm("Delete this job permanently?")) { onDelete(job.id); onClose(); } }}
            style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #dc2626", background: "transparent", color: "#dc2626", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>DELETE</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #475569", background: "transparent", color: "#94a3b8", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>CANCEL</button>
            <button onClick={handleSave} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#dc2626", color: "white", cursor: "pointer", fontFamily: "'Oswald', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>SAVE</button>
          </div>
        </div>
      </div>
    </div>
  );
}
