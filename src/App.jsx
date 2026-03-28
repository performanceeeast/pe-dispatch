import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSupabaseStore } from "./hooks/useSupabaseStore";

// ─── CONSTANTS ───
const TECHS = [
  { id: "jake", name: "Jake", specialty: "Marine / Watercraft", color: "#2563eb" },
  { id: "tyler", name: "Tyler", specialty: "Marine PDI / Electrical", color: "#7c3aed" },
  { id: "danny", name: "Danny", specialty: "Offroad / Engine Work", color: "#c0272d" },
  { id: "ray", name: "Ray", specialty: "Offroad / Diagnostics", color: "#c2410c" },
  { id: "cody", name: "Cody", specialty: "Offroad / Accessories", color: "#0d7c66" },
];
const PRIORITIES = {
  P1: { label: "P1 Critical", color: "#fff", bg: "#c0272d", border: "#c0272d" },
  P2: { label: "P2 High", color: "#fff", bg: "#d97706", border: "#d97706" },
  P3: { label: "P3 Normal", color: "#fff", bg: "#4b5563", border: "#4b5563" },
  P4: { label: "P4 Low", color: "#6b7280", bg: "#e5e7eb", border: "#d1d5db" },
};
const STATUSES = {
  NOT_STARTED: { label: "Not Started", color: "#6b7280", bg: "#f3f4f6", icon: "○" },
  IN_PROGRESS: { label: "In Progress", color: "#1d4ed8", bg: "#dbeafe", icon: "◐" },
  ON_HOLD: { label: "On Hold", color: "#92400e", bg: "#fef3c7", icon: "⏸" },
  WAITING_PARTS: { label: "Waiting Parts", color: "#6b21a8", bg: "#f3e8ff", icon: "📦" },
  COMPLETED: { label: "Completed", color: "#166534", bg: "#dcfce7", icon: "✓" },
};
const UNIT_TYPES = ["OFFROAD", "WATERCRAFT"];
const JOB_TYPES = ["CUSTOMER PAY","WARRANTY REPAIR","AFTERMARKET WARRANTY","INSURANCE CLAIM","SETUP/PDI","ACCESSORY INSTALL","ENGINE WORK","ELECTRICAL","DIAG","FABRICATION/WELDING","UPHOLSTERY/COSMETIC","COMEBACK","SERVICE","FULL SERVICE"];
const SKILL_LEVELS = ["BASIC","INTERMEDIATE","ADVANCED","SPECIALIST"];
const FLAT_RATE_OPTS = ["LOW (<2 HRS)","MEDIUM (2-4 HRS)","HIGH (4+ HRS)","FLAT RATE","N/A","NONE"];
const PARTS_STATUSES = ["ALL PARTS IN","SOME PARTS IN","WAITING FOR PARTS","NOT ORDERED YET","NO PARTS"];

// (seed data and localStorage store removed - using Supabase now)

// ─── THEME ───
const C = {
  bg: "#eef0f4", surface: "#ffffff", card: "#f6f7f9", border: "#dde0e6",
  borderLight: "#c8ccd4", text: "#1a1a1a", textMuted: "#5f6673", textDim: "#8a8f9a",
  accent: "#c0272d", white: "#ffffff", black: "#1a1a1a",
  input: "#ffffff", inputBorder: "#c8ccd4",
  headerBg: "#1e2028", headerText: "#ffffff",
};

// ─── UI ───
function Badge({children,color,bg,border,small}){
  return<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:small?"1px 6px":"2px 8px",borderRadius:3,fontSize:small?9:10,fontWeight:700,color,backgroundColor:bg,border:`1px solid ${border||bg}`,letterSpacing:.5,whiteSpace:"nowrap",fontFamily:"'DM Mono',monospace",textTransform:"uppercase"}}>{children}</span>;
}
function PB({p}){const x=PRIORITIES[p];return x?<Badge color={x.color} bg={x.bg} border={x.border}>{p}</Badge>:null}
function SB({s}){const x=STATUSES[s];return x?<Badge color={x.color} bg={x.bg}>{x.icon} {x.label}</Badge>:null}
function PtB({ps}){
  const g=ps==="ALL PARTS IN",w=ps==="WAITING FOR PARTS",n=ps==="NOT ORDERED YET";
  const color=g?"#166534":w?"#6b21a8":n?"#991b1b":"#92400e";
  const bg=g?"#dcfce7":w?"#f3e8ff":n?"#fee2e2":"#fef3c7";
  return<Badge color={color} bg={bg} small>{ps}</Badge>;
}
function Sel({label,value,onChange,options,allowEmpty,emptyLabel}){
  return<div style={{display:"flex",flexDirection:"column",gap:3}}>
    {label&&<label style={{fontSize:9,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1,fontFamily:"'DM Mono',monospace"}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"6px 8px",borderRadius:4,border:`1px solid ${C.inputBorder}`,background:C.input,color:C.text,fontSize:12,fontFamily:"'DM Mono',monospace",cursor:"pointer",outline:"none"}}>
      {allowEmpty&&<option value="">{emptyLabel||"All"}</option>}
      {options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>;
}
function Inp({label,value,onChange,type,placeholder,style:xs}){
  return<div style={{display:"flex",flexDirection:"column",gap:3,...xs}}>
    {label&&<label style={{fontSize:9,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1,fontFamily:"'DM Mono',monospace"}}>{label}</label>}
    <input type={type||"text"} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{padding:"6px 8px",borderRadius:4,border:`1px solid ${C.inputBorder}`,background:C.input,color:C.text,fontSize:12,fontFamily:"'DM Mono',monospace",outline:"none"}} />
  </div>;
}

// ─── EDITABLE NOTES ───
function EditableNotes({value,onSave}){
  const[editing,setEditing]=useState(false);const[draft,setDraft]=useState(value||"");const ref=useRef(null);
  useEffect(()=>{if(editing&&ref.current)ref.current.focus()},[editing]);
  useEffect(()=>{setDraft(value||"")},[value]);
  const commit=()=>{setEditing(false);if(draft!==(value||""))onSave(draft.toUpperCase())};
  if(editing)return<textarea ref={ref} value={draft} onChange={e=>setDraft(e.target.value)}
    onBlur={commit} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();commit()}if(e.key==="Escape"){setDraft(value||"");setEditing(false)}}}
    style={{width:"100%",minHeight:44,padding:"5px 7px",borderRadius:4,border:`2px solid ${C.accent}`,background:C.input,color:C.text,fontSize:11,fontFamily:"'DM Mono',monospace",resize:"vertical",outline:"none",lineHeight:1.4}} />;
  return<div onClick={()=>setEditing(true)} title="Click to edit"
    style={{minHeight:26,padding:"4px 7px",borderRadius:4,border:`1px dashed ${C.border}`,cursor:"text",fontSize:11,color:value?C.text:C.textDim,fontFamily:"'DM Mono',monospace",lineHeight:1.4,whiteSpace:"pre-wrap",wordBreak:"break-word",background:"transparent",transition:"border-color 0.15s"}}
    onMouseEnter={e=>e.currentTarget.style.borderColor=C.textDim} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
    {value||"click to add notes..."}
  </div>;
}

// ─── MODAL ───
function Modal({onClose,children}){return<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px 8px",overflowY:"auto"}} onClick={onClose}>
  <div onClick={e=>e.stopPropagation()} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 16px",maxWidth:620,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.2)",marginTop:16,marginBottom:16}}>{children}</div></div>}

function JobForm({title,initial,onSubmit,onClose,onDelete}){
  const[f,setF]=useState(initial);const u=(k,v)=>setF(p=>({...p,[k]:v}));
  return<Modal onClose={onClose}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <h2 style={{color:C.white,fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:600,letterSpacing:1,margin:0}}>{title}</h2>
      <button onClick={onClose} style={{background:"none",border:"none",color:C.textDim,fontSize:20,cursor:"pointer"}}>✕</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Inp label="RO / Job ID" value={f.jobId} onChange={v=>u("jobId",v)} placeholder="326XXX" />
      <Inp label="Customer" value={f.customer} onChange={v=>u("customer",v.toUpperCase())} placeholder="LAST NAME" />
      <Sel label="Unit Type" value={f.unitType} onChange={v=>u("unitType",v)} options={UNIT_TYPES} />
      <Sel label="Job Type" value={f.jobType} onChange={v=>u("jobType",v)} options={JOB_TYPES} />
      <div style={{gridColumn:"1/-1"}}><Inp label="Job Description" value={f.jobDesc} onChange={v=>u("jobDesc",v.toUpperCase())} placeholder="Describe the work" /></div>
      <Sel label="Skill Needed" value={f.skillNeeded} onChange={v=>u("skillNeeded",v)} options={SKILL_LEVELS} />
      <Sel label="Flat Rate" value={f.flatRate} onChange={v=>u("flatRate",v)} options={FLAT_RATE_OPTS} />
      <Sel label="Parts Status" value={f.partsStatus} onChange={v=>u("partsStatus",v)} options={PARTS_STATUSES} />
      <Sel label="Priority" value={f.priority} onChange={v=>u("priority",v)} options={Object.entries(PRIORITIES).map(([k,v])=>({value:k,label:v.label}))} />
      <Sel label="Assign Tech" value={f.assignedTech} onChange={v=>u("assignedTech",v)} options={[{value:"",label:"Unassigned"},...TECHS.map(t=>({value:t.id,label:t.name}))]} />
      <Sel label="Status" value={f.status} onChange={v=>u("status",v)} options={Object.entries(STATUSES).map(([k,v])=>({value:k,label:v.label}))} />
      <Inp label="Est. Hours" value={f.estHours} onChange={v=>u("estHours",v)} type="number" placeholder="0.0" />
      <Inp label="Date" value={f.dateAdded} onChange={v=>u("dateAdded",v)} type="date" />
      <div style={{gridColumn:"1/-1"}}>
        <label style={{fontSize:9,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:1,fontFamily:"'DM Mono',monospace",display:"block",marginBottom:3}}>NOTES</label>
        <textarea value={f.notes} onChange={e=>u("notes",e.target.value.toUpperCase())} rows={3} style={{width:"100%",padding:"8px",borderRadius:4,border:`1px solid ${C.inputBorder}`,background:C.input,color:C.text,fontSize:12,fontFamily:"'DM Mono',monospace",resize:"vertical",outline:"none",boxSizing:"border-box"}} />
      </div>
    </div>
    <div style={{display:"flex",gap:10,marginTop:20,justifyContent:"space-between"}}>
      <div>{onDelete&&<button onClick={()=>{if(confirm("Delete permanently?"))onDelete()}} style={{padding:"8px 16px",borderRadius:6,border:`1px solid ${C.accent}`,background:"transparent",color:C.accent,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12}}>DELETE</button>}</div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{padding:"8px 16px",borderRadius:6,border:`1px solid ${C.border}`,background:"transparent",color:C.textMuted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12}}>CANCEL</button>
        <button onClick={()=>{if(!f.jobId||!f.customer)return;onSubmit({...f,estHours:parseFloat(f.estHours)||0})}} style={{padding:"8px 20px",borderRadius:6,border:"none",background:C.accent,color:C.white,cursor:"pointer",fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:600,letterSpacing:1}}>SAVE</button>
      </div>
    </div>
  </Modal>;
}

// ─── JOB ROW ───
function JobRow({job,onUpdate,onEdit}){
  const tech=TECHS.find(t=>t.id===job.assignedTech);
  return<tr style={{borderBottom:`1px solid ${C.border}`,transition:"background 0.1s"}}
    onMouseEnter={e=>e.currentTarget.style.background=C.card} onMouseLeave={e=>e.currentTarget.style.background=C.white}>
    <td style={{padding:"10px 10px"}}><PB p={job.priority} /></td>
    <td style={{padding:"10px 6px"}}><span onClick={()=>onEdit(job)} style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:C.accent,cursor:"pointer",fontWeight:600}}>{job.jobId}</span></td>
    <td style={{padding:"10px 6px"}}><div style={{fontWeight:600,color:C.black,fontSize:13}}>{job.customer}</div><div style={{color:C.textDim,fontSize:10,marginTop:1}}>{job.unitType}</div></td>
    <td style={{padding:"10px 6px"}}><div style={{color:C.text,fontSize:12}}>{job.jobDesc||job.jobType}</div><div style={{color:C.textDim,fontSize:10,marginTop:2}}>{job.skillNeeded} · {job.flatRate}</div></td>
    <td style={{padding:"10px 6px"}}>{(()=>{const g=job.partsStatus==="ALL PARTS IN",w=job.partsStatus==="WAITING FOR PARTS",n=job.partsStatus==="NOT ORDERED YET";const color=g?"#166534":w?"#6b21a8":n?"#991b1b":"#92400e";const bg=g?"#dcfce7":w?"#f3e8ff":n?"#fee2e2":"#fef3c7";return<select value={job.partsStatus} onChange={e=>onUpdate(job.id,"partsStatus",e.target.value)} style={{background:bg,border:"none",borderRadius:4,color,fontSize:10,fontWeight:700,padding:"4px 8px",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>{PARTS_STATUSES.map(ps=><option key={ps} value={ps}>{ps}</option>)}</select>})()}</td>
    <td style={{padding:"10px 6px"}}>{tech?<span style={{fontSize:12,fontWeight:700,color:tech.color,fontFamily:"'DM Mono',monospace"}}>{tech.name.toUpperCase()}</span>:<select value="" onChange={e=>onUpdate(job.id,"assignedTech",e.target.value)} style={{background:C.input,border:`1px solid ${C.inputBorder}`,borderRadius:4,color:C.textMuted,fontSize:11,padding:"3px 6px",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}><option value="">Assign...</option>{TECHS.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>}</td>
    <td style={{padding:"10px 6px",fontFamily:"'DM Mono',monospace",fontSize:12,color:C.textMuted,textAlign:"center"}}>{job.estHours>0?`${job.estHours}h`:"—"}</td>
    <td style={{padding:"10px 6px"}}><select value={job.status} onChange={e=>onUpdate(job.id,"status",e.target.value)} style={{background:STATUSES[job.status]?.bg,border:"none",borderRadius:4,color:STATUSES[job.status]?.color,fontSize:10,fontWeight:700,padding:"4px 8px",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>{Object.entries(STATUSES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></td>
    <td style={{padding:"6px 6px",minWidth:200,maxWidth:280}}><EditableNotes value={job.notes} onSave={v=>onUpdate(job.id,"notes",v)} /></td>
  </tr>;
}

// ─── TECH CARD ───
function TechCard({tech,jobs,onUpdate}){
  const open=jobs.filter(j=>j.assignedTech===tech.id&&j.status!=="COMPLETED");
  const done=jobs.filter(j=>j.assignedTech===tech.id&&j.status==="COMPLETED").length;
  const hrs=open.reduce((s,j)=>s+(j.estHours||0),0);
  return<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16,borderLeft:`4px solid ${tech.color}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div><div style={{fontFamily:"'Oswald',sans-serif",fontSize:18,fontWeight:600,color:tech.color,letterSpacing:1}}>{tech.name.toUpperCase()}</div><div style={{fontSize:10,color:C.textDim,fontFamily:"'DM Mono',monospace"}}>{tech.specialty}</div></div>
      <div style={{textAlign:"right"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:20,fontWeight:700,color:C.black}}>{hrs.toFixed(1)}h</div><div style={{fontSize:9,color:C.textDim,fontFamily:"'DM Mono',monospace"}}>QUEUED</div></div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:12}}>
      {[{v:open.length,l:"OPEN",c:"#d97706"},{v:open.filter(j=>j.status==="IN_PROGRESS").length,l:"ACTIVE",c:"#2563eb"},{v:done,l:"DONE",c:"#16a34a"}].map(s=><div key={s.l} style={{flex:1,background:C.card,borderRadius:6,padding:"6px 10px",textAlign:"center",border:`1px solid ${C.border}`}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:8,color:C.textDim,fontFamily:"'DM Mono',monospace",letterSpacing:.5}}>{s.l}</div></div>)}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {open.sort((a,b)=>a.priority.localeCompare(b.priority)).slice(0,6).map(j=>{const pc=PRIORITIES[j.priority];return<div key={j.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:C.card,borderRadius:6,fontSize:11,border:`1px solid ${C.border}`}}>
        <span style={{width:8,height:8,borderRadius:2,background:pc?.bg||"#999",flexShrink:0}} />
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:C.accent,fontWeight:600,flexShrink:0}}>{j.jobId}</span>
        <span style={{color:C.black,fontWeight:600,flexShrink:0}}>{j.customer}</span>
        <span style={{color:C.textMuted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{j.jobDesc||j.jobType}</span>
        <span style={{color:C.textDim,fontFamily:"'DM Mono',monospace",fontSize:10,flexShrink:0}}>{j.estHours}h</span>
        <select value={j.status} onChange={e=>onUpdate(j.id,"status",e.target.value)} style={{background:STATUSES[j.status]?.bg,border:"none",borderRadius:3,color:STATUSES[j.status]?.color,fontSize:9,fontWeight:700,padding:"2px 4px",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>{Object.entries(STATUSES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select>
      </div>})}
      {open.length>6&&<div style={{fontSize:10,color:C.textDim,textAlign:"center",padding:4,fontFamily:"'DM Mono',monospace"}}>+{open.length-6} more</div>}
      {open.length===0&&<div style={{fontSize:11,color:C.textDim,textAlign:"center",padding:12,fontStyle:"italic"}}>No open jobs</div>}
    </div>
  </div>;
}

// ─── WEEK HELPERS ───
function getWeekDays(offset=0){
  const now=new Date();const day=now.getDay();const mon=new Date(now);
  mon.setDate(now.getDate()-((day===0?6:day-1))+(offset*7));
  return["MON","TUE","WED","THU","FRI","SAT"].map((_,i)=>{
    const d=new Date(mon);d.setDate(mon.getDate()+i);
    return{label:_,date:d.toISOString().split('T')[0],short:`${d.getMonth()+1}/${d.getDate()}`};
  });
}

// ─── WEEKLY SCHEDULE ───
function WeeklySchedule({tech,jobs,schedule,scheduleJob,unscheduleJob,getSchedule,onUpdate}){
  const[weekOff,setWeekOff]=useState(0);
  const[dragJob,setDragJob]=useState(null);
  const days=getWeekDays(weekOff);
  const open=jobs.filter(j=>j.assignedTech===tech.id&&j.status!=="COMPLETED");

  // find jobs scheduled anywhere this week for this tech
  const scheduledIds=new Set();
  days.forEach(d=>{(getSchedule(tech.id,d.date)||[]).forEach(id=>scheduledIds.add(id))});
  const unscheduled=open.filter(j=>!scheduledIds.has(j.id));

  const handleDragStart=(e,jobId)=>{setDragJob(jobId);e.dataTransfer.effectAllowed="move"};
  const handleDragOver=e=>{e.preventDefault();e.dataTransfer.dropEffect="move"};
  const handleDrop=(e,day)=>{e.preventDefault();if(dragJob){scheduleJob(tech.id,day,dragJob);setDragJob(null)}};

  // touch support
  const[touchJob,setTouchJob]=useState(null);

  return<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginTop:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:600,color:tech.color,letterSpacing:1}}>
        {tech.name.toUpperCase()} — WEEKLY SCHEDULE
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <button onClick={()=>setWeekOff(p=>p-1)} style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${C.border}`,background:C.card,color:C.textMuted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11}}>◄</button>
        <button onClick={()=>setWeekOff(0)} style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${C.border}`,background:weekOff===0?C.accent:C.card,color:weekOff===0?C.white:C.textMuted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11}}>THIS WEEK</button>
        <button onClick={()=>setWeekOff(p=>p+1)} style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${C.border}`,background:C.card,color:C.textMuted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11}}>►</button>
      </div>
    </div>

    {/* Unscheduled pool */}
    {unscheduled.length>0&&<div style={{marginBottom:12}}>
      <div style={{fontSize:10,fontWeight:700,color:C.textDim,letterSpacing:1,fontFamily:"'DM Mono',monospace",marginBottom:6}}>DRAG TO SCHEDULE ({unscheduled.length})</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {unscheduled.map(j=>{const pc=PRIORITIES[j.priority];return<div key={j.id} draggable onDragStart={e=>handleDragStart(e,j.id)}
          onClick={()=>setTouchJob(touchJob===j.id?null:j.id)}
          style={{display:"flex",alignItems:"center",gap:5,padding:"5px 8px",background:C.card,borderRadius:5,fontSize:10,border:`1px solid ${touchJob===j.id?tech.color:C.border}`,cursor:"grab",userSelect:"none",transition:"border-color 0.15s"}}>
          <span style={{width:6,height:6,borderRadius:2,background:pc?.bg||"#999",flexShrink:0}} />
          <span style={{fontFamily:"'DM Mono',monospace",color:C.accent,fontWeight:600}}>{j.jobId}</span>
          <span style={{color:C.black,fontWeight:600}}>{j.customer}</span>
          <span style={{color:C.textDim}}>{j.estHours}h</span>
        </div>})}
      </div>
      {touchJob&&<div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
        <span style={{fontSize:10,color:C.textDim,fontFamily:"'DM Mono',monospace",alignSelf:"center"}}>Add to:</span>
        {days.map(d=><button key={d.date} onClick={()=>{scheduleJob(tech.id,d.date,touchJob);setTouchJob(null)}}
          style={{padding:"3px 8px",borderRadius:3,border:`1px solid ${C.border}`,background:C.card,color:C.textMuted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:10}}>{d.label} {d.short}</button>)}
      </div>}
    </div>}

    {/* Day columns */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(6, 1fr)",gap:6}}>
      {days.map(d=>{
        const dayJobs=(getSchedule(tech.id,d.date)||[]).map(id=>jobs.find(j=>j.id===id)).filter(Boolean);
        const dayHrs=dayJobs.reduce((s,j)=>s+(j.estHours||0),0);
        const isToday=d.date===new Date().toISOString().split('T')[0];
        return<div key={d.date} onDragOver={handleDragOver} onDrop={e=>handleDrop(e,d.date)}
          style={{background:isToday?"#f0f7ff":C.card,border:`1px solid ${isToday?tech.color+"44":C.border}`,borderRadius:6,padding:8,minHeight:100}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:600,color:isToday?tech.color:C.textMuted,letterSpacing:.5}}>{d.label}</div>
              <div style={{fontSize:9,color:C.textDim,fontFamily:"'DM Mono',monospace"}}>{d.short}</div>
            </div>
            {dayHrs>0&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,color:dayHrs>8?"#c0272d":C.textMuted}}>{dayHrs.toFixed(1)}h</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {dayJobs.map(j=>{const pc=PRIORITIES[j.priority];return<div key={j.id} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 6px",background:C.surface,borderRadius:4,fontSize:9,border:`1px solid ${C.border}`}}>
              <span style={{width:5,height:5,borderRadius:1,background:pc?.bg||"#999",flexShrink:0}} />
              <span style={{fontFamily:"'DM Mono',monospace",color:C.accent,fontWeight:600}}>{j.jobId}</span>
              <span style={{color:C.black,fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{j.customer}</span>
              <span style={{color:C.textDim,fontFamily:"'DM Mono',monospace"}}>{j.estHours}h</span>
              <button onClick={()=>unscheduleJob(tech.id,d.date,j.id)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:10,padding:"0 2px",lineHeight:1}} title="Remove">✕</button>
            </div>})}
            {dayJobs.length===0&&<div style={{fontSize:9,color:C.borderLight,textAlign:"center",padding:"12px 0",fontStyle:"italic",fontFamily:"'DM Mono',monospace"}}>Drop here</div>}
          </div>
        </div>})}
    </div>
  </div>;
}

// ─── APP ───
export default function App(){
  const{jobs,loading,error,schedule,add,upd,updFull,del,arch,reset,exp,imp,scheduleJob,unscheduleJob,getSchedule,refresh}=useSupabaseStore();
  const[view,setView]=useState("queue");const[showAdd,setShowAdd]=useState(false);const[editJ,setEditJ]=useState(null);const[showSet,setShowSet]=useState(false);
  const[fP,setFP]=useState("");const[fT,setFT]=useState("");const[fS,setFS]=useState("");const[fPt,setFPt]=useState("");const[fU,setFU]=useState("");
  const[sF,setSF]=useState("priority");const[sD,setSD]=useState("asc");const[q,setQ]=useState("");const fR=useRef(null);
  const[schedTech,setSchedTech]=useState(null);
  const[myTech,setMyTech]=useState(()=>{try{return localStorage.getItem('pe_mytech')||""}catch{return ""}});

  useEffect(()=>{const l=document.createElement("link");l.href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600&display=swap";l.rel="stylesheet";document.head.appendChild(l)},[]);

  const doSort=f=>{if(sF===f)setSD(d=>d==="asc"?"desc":"asc");else{setSF(f);setSD("asc")}};
  const filtered=useMemo(()=>{let l=[...jobs];if(fP)l=l.filter(j=>j.priority===fP);if(fT)l=l.filter(j=>j.assignedTech===fT);if(fS)l=l.filter(j=>j.status===fS);if(fPt)l=l.filter(j=>j.partsStatus===fPt);if(fU)l=l.filter(j=>j.unitType===fU);if(q){const s=q.toUpperCase();l=l.filter(j=>j.customer.includes(s)||j.jobId.includes(s)||(j.jobDesc||"").includes(s)||(j.notes||"").includes(s))}l.sort((a,b)=>{let av=a[sF]||"",bv=b[sF]||"";if(sF==="estHours"){av=a.estHours||0;bv=b.estHours||0}return sD==="asc"?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0)});return l},[jobs,fP,fT,fS,fPt,fU,q,sF,sD]);
  const st=useMemo(()=>{const o=jobs.filter(j=>j.status!=="COMPLETED");return{total:jobs.length,open:o.length,comp:jobs.length-o.length,ip:jobs.filter(j=>j.status==="IN_PROGRESS").length,wp:o.filter(j=>j.partsStatus==="WAITING FOR PARTS").length,oh:jobs.filter(j=>j.status==="ON_HOLD").length,hrs:o.reduce((s,j)=>s+(j.estHours||0),0),p1:o.filter(j=>j.priority==="P1").length}},[jobs]);

  // Loading screen
  if(loading)return<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
    <img src="/logo.png" alt="Performance East" style={{height:50,objectFit:"contain"}} onError={e=>{e.target.style.display='none'}} />
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,color:C.accent,letterSpacing:2}}>LOADING DISPATCH BOARD...</div>
    <div style={{width:40,height:40,border:`3px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;

  if(error)return<div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,padding:20}}>
    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:18,color:C.accent}}>CONNECTION ERROR</div>
    <div style={{color:C.textMuted,fontSize:13,textAlign:"center",maxWidth:400}}>{error}</div>
    <button onClick={()=>window.location.reload()} style={{padding:"8px 20px",borderRadius:6,border:"none",background:C.accent,color:C.white,cursor:"pointer",fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,letterSpacing:1,marginTop:8}}>RETRY</button>
  </div>;

  const thStyle=f=>({padding:"10px 6px",textAlign:"left",fontSize:9,fontWeight:700,color:sF===f?C.black:C.textDim,cursor:"pointer",userSelect:"none",letterSpacing:1,fontFamily:"'DM Mono',monospace",textTransform:"uppercase",borderBottom:`2px solid ${C.border}`,background:sF===f?C.card:"transparent"});

  const btnStyle = {padding:"6px 12px",borderRadius:4,border:`1px solid ${C.border}`,background:C.card,color:C.textMuted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11};

  return<div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Outfit',sans-serif",color:C.text}}>
    {/* HEADER */}
    <div style={{background:"linear-gradient(180deg, #1e2028 0%, #16181e 100%)",borderBottom:`3px solid ${C.accent}`,padding:"8px 12px",position:"sticky",top:0,zIndex:100}}>
      {/* Row 1: Logo + Actions */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <img src="/logo.png" alt="Performance East" style={{height:36,objectFit:"contain",flexShrink:0}} onError={e=>{e.target.style.display='none'}} />
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button onClick={()=>setShowSet(!showSet)} style={{padding:"6px 8px",borderRadius:6,border:"1px solid #3a3d45",background:"transparent",color:"#9ca3af",cursor:"pointer",fontSize:13,lineHeight:1}}>⚙</button>
          <button onClick={()=>setShowAdd(true)} style={{padding:"6px 10px",borderRadius:6,border:"none",background:C.accent,color:C.white,cursor:"pointer",fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:600,letterSpacing:1,whiteSpace:"nowrap"}}>+ NEW</button>
        </div>
      </div>
      {/* Row 2: Tabs */}
      <div style={{display:"flex",gap:2,background:"#2a2d35",borderRadius:6,padding:2,marginTop:8}}>
        {[{k:"queue",l:"JOBS"},{k:"techs",l:"TECHS"},{k:"myboard",l:"MY BOARD"},{k:"dash",l:"DASH"}].map(t=><button key={t.k} onClick={()=>setView(t.k)} style={{flex:1,padding:"7px 6px",borderRadius:4,border:"none",cursor:"pointer",fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:500,letterSpacing:1,background:view===t.k?C.accent:"transparent",color:view===t.k?C.white:"#9ca3af",transition:"all 0.15s"}}>{t.l}</button>)}
      </div>
      {/* Row 3: Stats */}
      <div style={{display:"flex",justifyContent:"space-around",marginTop:8,padding:"4px 0"}}>
        {[{v:st.open,l:"OPEN",c:"#fbbf24"},{v:st.p1,l:"P1",c:st.p1>0?"#f87171":"#4ade80"},{v:st.wp,l:"PARTS",c:st.wp>0?"#c084fc":"#4ade80"},{v:`${st.hrs.toFixed(1)}h`,l:"QUEUED",c:"#60a5fa"}].map(s=><div key={s.l} style={{textAlign:"center"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:15,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:8,color:"#8a8f9a",fontFamily:"'DM Mono',monospace",letterSpacing:.5}}>{s.l}</div></div>)}
      </div>
    </div>

    {showSet&&<div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"8px 12px",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <button onClick={refresh} style={btnStyle}>🔄 SYNC</button>
      <button onClick={exp} style={btnStyle}>↓ EXPORT</button>
      <button onClick={()=>fR.current?.click()} style={btnStyle}>↑ IMPORT</button>
      <input ref={fR} type="file" accept=".json" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{if(imp(ev.target.result))alert("Imported!");else alert("Failed.")};r.readAsText(f);e.target.value=""}} />
      <button onClick={()=>{if(confirm(`Archive ${st.comp} completed?`))arch()}} style={btnStyle}>🗄 ARCHIVE ({st.comp})</button>
      <button onClick={()=>{if(confirm("Reset all data?"))reset()}} style={{...btnStyle,borderColor:C.accent,color:C.accent}}>⟲ RESET</button>
      <span style={{fontSize:9,color:C.textDim,fontFamily:"'DM Mono',monospace",marginLeft:"auto"}}>{jobs.length} jobs · auto-saves</span>
    </div>}

    <div style={{maxWidth:1500,margin:"0 auto",padding:"12px 10px 60px"}}>
      {view==="queue"&&<>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div style={{flex:"1 1 100%",minWidth:0}}><Inp label="Search" value={q} onChange={setQ} placeholder="Customer, RO#, description, notes..." /></div>
          <div style={{flex:"1 1 45%",minWidth:100}}><Sel label="Priority" value={fP} onChange={setFP} allowEmpty options={Object.entries(PRIORITIES).map(([k,v])=>({value:k,label:v.label}))} /></div>
          <div style={{flex:"1 1 45%",minWidth:100}}><Sel label="Tech" value={fT} onChange={setFT} allowEmpty emptyLabel="All Techs" options={TECHS.map(t=>({value:t.id,label:t.name}))} /></div>
          <div style={{flex:"1 1 45%",minWidth:100}}><Sel label="Status" value={fS} onChange={setFS} allowEmpty options={Object.entries(STATUSES).map(([k,v])=>({value:k,label:v.label}))} /></div>
          <div style={{flex:"1 1 45%",minWidth:100}}><Sel label="Parts" value={fPt} onChange={setFPt} allowEmpty options={PARTS_STATUSES} /></div>
          <div style={{flex:"1 1 45%",minWidth:100}}><Sel label="Unit" value={fU} onChange={setFU} allowEmpty options={UNIT_TYPES} /></div>
        </div>
        <div style={{background:C.surface,borderRadius:10,border:`1px solid ${C.border}`,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{[{f:"priority",l:"PRI"},{f:"jobId",l:"RO#"},{f:"customer",l:"CUSTOMER"},{f:"jobDesc",l:"JOB",ns:1},{f:"partsStatus",l:"PARTS"},{f:"assignedTech",l:"TECH"},{f:"estHours",l:"HRS"},{f:"status",l:"STATUS"},{f:"notes",l:"NOTES",ns:1}].map(c=><th key={c.f} style={{...thStyle(c.f),...(c.f==="estHours"?{textAlign:"center"}:{}), ...(c.f==="notes"?{minWidth:200}:{})}} onClick={()=>!c.ns&&doSort(c.f)}>{c.l}{sF===c.f?(sD==="asc"?" ↑":" ↓"):""}</th>)}</tr></thead>
              <tbody>{filtered.map(j=><JobRow key={j.id} job={j} onUpdate={upd} onEdit={setEditJ} />)}</tbody>
            </table>
          </div>
          <div style={{padding:"10px 16px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",background:C.card}}>
            <span style={{fontSize:11,color:C.textDim,fontFamily:"'DM Mono',monospace"}}>{filtered.length} jobs · click RO# to edit</span>
            <span style={{fontSize:11,color:C.textDim,fontFamily:"'DM Mono',monospace"}}>{filtered.reduce((s,j)=>s+(j.estHours||0),0).toFixed(1)} total hours</span>
          </div>
        </div>
      </>}

      {view==="techs"&&<>
        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:15,fontWeight:600,color:C.textMuted,letterSpacing:2,marginBottom:14}}>TECHNICIAN WORKLOADS</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",gap:14}}>
          {TECHS.map(t=><div key={t.id}>
            <TechCard tech={t} jobs={jobs} onUpdate={upd} />
            <button onClick={()=>setSchedTech(schedTech===t.id?null:t.id)} style={{width:"100%",marginTop:6,padding:"8px",borderRadius:6,border:`1px solid ${schedTech===t.id?t.color:C.border}`,background:schedTech===t.id?t.color+"11":C.surface,color:schedTech===t.id?t.color:C.textMuted,cursor:"pointer",fontFamily:"'Oswald',sans-serif",fontSize:11,fontWeight:500,letterSpacing:1,transition:"all 0.15s"}}>
              {schedTech===t.id?"▲ HIDE SCHEDULE":"▼ WEEKLY SCHEDULE"}
            </button>
          </div>)}
        </div>
        {schedTech&&<WeeklySchedule tech={TECHS.find(t=>t.id===schedTech)} jobs={jobs} schedule={schedule} scheduleJob={scheduleJob} unscheduleJob={unscheduleJob} getSchedule={getSchedule} onUpdate={upd} />}
        <div style={{marginTop:20,background:C.surface,borderRadius:10,border:`1px solid ${C.border}`,padding:18}}>
          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:C.textMuted,letterSpacing:2,marginBottom:12}}>UNASSIGNED JOBS</div>
          {jobs.filter(j=>!j.assignedTech&&j.status!=="COMPLETED").map(j=><div key={j.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:6,marginBottom:5,border:`1px solid ${C.border}`}}><PB p={j.priority} /><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.textDim}}>{j.jobId}</span><span style={{color:C.text,fontSize:12,fontWeight:500,flex:1}}>{j.customer} — {j.jobDesc||j.jobType}</span><PtB ps={j.partsStatus} /><select onChange={e=>{if(e.target.value)upd(j.id,"assignedTech",e.target.value)}} style={{background:C.input,border:`1px solid ${C.inputBorder}`,borderRadius:4,color:C.textMuted,fontSize:11,padding:"4px 8px",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}><option value="">Assign →</option>{TECHS.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>)}
          {jobs.filter(j=>!j.assignedTech&&j.status!=="COMPLETED").length===0&&<div style={{color:C.textDim,fontSize:12,textAlign:"center",padding:16,fontStyle:"italic"}}>All jobs assigned</div>}
        </div>
      </>}

      {view==="myboard"&&<>
        {!myTech?<div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontFamily:"'Oswald',sans-serif",fontSize:20,fontWeight:600,color:C.black,letterSpacing:1,marginBottom:6}}>SELECT YOUR NAME</div>
          <div style={{fontSize:13,color:C.textMuted,marginBottom:20}}>This saves to your browser so you only have to pick once</div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={()=>{setMyTech("main");localStorage.setItem('pe_mytech','main')}} style={{padding:"14px 28px",borderRadius:8,border:`2px solid ${C.accent}`,background:C.surface,color:C.accent,cursor:"pointer",fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:600,letterSpacing:1,transition:"all 0.15s",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}
              onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.color=C.white}}
              onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.color=C.accent}}>
              MAIN
            </button>
            {TECHS.map(t=><button key={t.id} onClick={()=>{setMyTech(t.id);localStorage.setItem('pe_mytech',t.id)}} style={{padding:"14px 28px",borderRadius:8,border:`2px solid ${t.color}`,background:C.surface,color:t.color,cursor:"pointer",fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:600,letterSpacing:1,transition:"all 0.15s",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}
              onMouseEnter={e=>{e.currentTarget.style.background=t.color;e.currentTarget.style.color=C.white}}
              onMouseLeave={e=>{e.currentTarget.style.background=C.surface;e.currentTarget.style.color=t.color}}>
              {t.name.toUpperCase()}
            </button>)}
          </div>
        </div>
        :myTech==="main"?(()=>{
          // MAIN VIEW — all techs schedules + full overview
          const allOpen=jobs.filter(j=>j.status!=="COMPLETED");
          return<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:48,height:48,borderRadius:10,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:C.white,fontFamily:"'Oswald',sans-serif"}}>SM</div>
                <div>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:C.accent,letterSpacing:1}}>SERVICE MANAGER — ALL TECHS</div>
                  <div style={{fontSize:11,color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>Main dispatch view</div>
                </div>
              </div>
              <button onClick={()=>{setMyTech("");localStorage.removeItem('pe_mytech')}} style={{padding:"6px 12px",borderRadius:4,border:`1px solid ${C.border}`,background:C.card,color:C.textMuted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:10}}>SWITCH VIEW</button>
            </div>

            {/* All tech schedules */}
            {TECHS.map(t=>{
              const tOpen=jobs.filter(j=>j.assignedTech===t.id&&j.status!=="COMPLETED");
              const tHrs=tOpen.reduce((s,j)=>s+(j.estHours||0),0);
              const tIP=tOpen.filter(j=>j.status==="IN_PROGRESS").length;
              const tDone=jobs.filter(j=>j.assignedTech===t.id&&j.status==="COMPLETED").length;
              return<div key={t.id} style={{marginBottom:16}}>
                {/* Tech summary bar */}
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:14,borderLeft:`4px solid ${t.color}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:600,color:t.color,letterSpacing:1}}>{t.name.toUpperCase()}</div>
                    <span style={{fontSize:10,color:C.textDim,fontFamily:"'DM Mono',monospace"}}>{t.specialty}</span>
                  </div>
                  <div style={{display:"flex",gap:12}}>
                    {[{v:tOpen.length,l:"OPEN",c:"#d97706"},{v:tIP,l:"ACTIVE",c:"#2563eb"},{v:tDone,l:"DONE",c:"#16a34a"},{v:`${tHrs.toFixed(1)}h`,l:"HOURS",c:"#0e7490"}].map(s=><div key={s.l} style={{textAlign:"center"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:14,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:7,color:C.textDim,fontFamily:"'DM Mono',monospace",letterSpacing:.5}}>{s.l}</div></div>)}
                  </div>
                </div>
                {/* Tech schedule */}
                <WeeklySchedule tech={t} jobs={jobs} schedule={schedule} scheduleJob={scheduleJob} unscheduleJob={unscheduleJob} getSchedule={getSchedule} onUpdate={upd} />
              </div>})}

            {/* Unassigned */}
            <div style={{background:C.surface,borderRadius:10,border:`1px solid ${C.border}`,padding:16,marginTop:8}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:C.textMuted,letterSpacing:2,marginBottom:10}}>UNASSIGNED JOBS</div>
              {jobs.filter(j=>!j.assignedTech&&j.status!=="COMPLETED").map(j=><div key={j.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:6,marginBottom:5,border:`1px solid ${C.border}`}}><PB p={j.priority} /><span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:C.textDim}}>{j.jobId}</span><span style={{color:C.text,fontSize:12,fontWeight:500,flex:1}}>{j.customer} — {j.jobDesc||j.jobType}</span><PtB ps={j.partsStatus} /><select onChange={e=>{if(e.target.value)upd(j.id,"assignedTech",e.target.value)}} style={{background:C.input,border:`1px solid ${C.inputBorder}`,borderRadius:4,color:C.textMuted,fontSize:11,padding:"4px 8px",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}><option value="">Assign →</option>{TECHS.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>)}
              {jobs.filter(j=>!j.assignedTech&&j.status!=="COMPLETED").length===0&&<div style={{color:C.textDim,fontSize:12,textAlign:"center",padding:16,fontStyle:"italic"}}>All jobs assigned</div>}
            </div>
          </>;
        })()
        :(()=>{
          const me=TECHS.find(t=>t.id===myTech);if(!me){setMyTech("");return null;}
          const myJobs=jobs.filter(j=>j.assignedTech===myTech);
          const myOpen=myJobs.filter(j=>j.status!=="COMPLETED");
          const myIP=myJobs.filter(j=>j.status==="IN_PROGRESS");
          const myDone=myJobs.filter(j=>j.status==="COMPLETED");
          const myHold=myJobs.filter(j=>j.status==="ON_HOLD");
          const myWait=myOpen.filter(j=>j.partsStatus==="WAITING FOR PARTS");
          const myHrs=myOpen.reduce((s,j)=>s+(j.estHours||0),0);
          return<>
            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:48,height:48,borderRadius:10,background:me.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:C.white,fontFamily:"'Oswald',sans-serif"}}>{me.name[0]}</div>
                <div>
                  <div style={{fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:me.color,letterSpacing:1}}>{me.name.toUpperCase()}</div>
                  <div style={{fontSize:11,color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>{me.specialty}</div>
                </div>
              </div>
              <button onClick={()=>{setMyTech("");localStorage.removeItem('pe_mytech')}} style={{padding:"6px 12px",borderRadius:4,border:`1px solid ${C.border}`,background:C.card,color:C.textMuted,cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:10}}>SWITCH TECH</button>
            </div>

            {/* My Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(90px, 1fr))",gap:8,marginBottom:16}}>
              {[{l:"OPEN",v:myOpen.length,c:"#d97706"},{l:"IN PROGRESS",v:myIP.length,c:"#2563eb"},{l:"ON HOLD",v:myHold.length,c:"#92400e"},{l:"WAIT PARTS",v:myWait.length,c:"#6b21a8"},{l:"DONE",v:myDone.length,c:"#16a34a"},{l:"HOURS",v:myHrs.toFixed(1),c:"#0e7490"}].map(s=><div key={s.l} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:10,textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:8,color:C.textDim,fontFamily:"'DM Mono',monospace",letterSpacing:.5,marginTop:2}}>{s.l}</div></div>)}
            </div>

            {/* My Weekly Schedule */}
            <WeeklySchedule tech={me} jobs={jobs} schedule={schedule} scheduleJob={scheduleJob} unscheduleJob={unscheduleJob} getSchedule={getSchedule} onUpdate={upd} />

            {/* My Open Jobs */}
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginTop:16}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:14,fontWeight:600,color:me.color,letterSpacing:1,marginBottom:12}}>MY OPEN JOBS ({myOpen.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {myOpen.sort((a,b)=>a.priority.localeCompare(b.priority)).map(j=>{const pc=PRIORITIES[j.priority];return<div key={j.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:C.card,borderRadius:6,fontSize:11,border:`1px solid ${C.border}`,flexWrap:"wrap"}}>
                  <span style={{width:8,height:8,borderRadius:2,background:pc?.bg||"#999",flexShrink:0}} />
                  <span style={{fontFamily:"'DM Mono',monospace",color:C.accent,fontWeight:600,flexShrink:0}}>{j.jobId}</span>
                  <span style={{color:C.black,fontWeight:600,flexShrink:0}}>{j.customer}</span>
                  <span style={{color:C.textMuted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:60}}>{j.jobDesc||j.jobType}</span>
                  <span style={{color:C.textDim,fontFamily:"'DM Mono',monospace",fontSize:10,flexShrink:0}}>{j.estHours}h</span>
                  {(()=>{const g=j.partsStatus==="ALL PARTS IN",w=j.partsStatus==="WAITING FOR PARTS",n=j.partsStatus==="NOT ORDERED YET";const color=g?"#166534":w?"#6b21a8":n?"#991b1b":"#92400e";const bg=g?"#dcfce7":w?"#f3e8ff":n?"#fee2e2":"#fef3c7";return<select value={j.partsStatus} onChange={e=>upd(j.id,"partsStatus",e.target.value)} style={{background:bg,border:"none",borderRadius:4,color,fontSize:9,fontWeight:700,padding:"3px 6px",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>{PARTS_STATUSES.map(ps=><option key={ps} value={ps}>{ps}</option>)}</select>})()}
                  <select value={j.status} onChange={e=>upd(j.id,"status",e.target.value)} style={{background:STATUSES[j.status]?.bg,border:"none",borderRadius:4,color:STATUSES[j.status]?.color,fontSize:9,fontWeight:700,padding:"3px 6px",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>{Object.entries(STATUSES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select>
                </div>})}
                {myOpen.length===0&&<div style={{color:C.textDim,fontSize:12,textAlign:"center",padding:20,fontStyle:"italic"}}>All caught up — no open jobs</div>}
              </div>
            </div>

            {/* Recently Completed */}
            {myDone.length>0&&<div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginTop:12}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:C.textDim,letterSpacing:1,marginBottom:10}}>RECENTLY COMPLETED ({myDone.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {myDone.slice(0,8).map(j=><div key={j.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:C.card,borderRadius:5,fontSize:10,border:`1px solid ${C.border}`,opacity:.7}}>
                  <span style={{color:"#16a34a",fontWeight:700}}>✓</span>
                  <span style={{fontFamily:"'DM Mono',monospace",color:C.textDim}}>{j.jobId}</span>
                  <span style={{color:C.textMuted,fontWeight:500}}>{j.customer} — {j.jobDesc||j.jobType}</span>
                  <span style={{color:C.textDim,fontFamily:"'DM Mono',monospace",marginLeft:"auto"}}>{j.estHours}h</span>
                </div>)}
                {myDone.length>8&&<div style={{fontSize:10,color:C.textDim,textAlign:"center",padding:4,fontFamily:"'DM Mono',monospace"}}>+{myDone.length-8} more completed</div>}
              </div>
            </div>}
          </>;
        })()}
      </>}

      {view==="dash"&&<>
        <div style={{fontFamily:"'Oswald',sans-serif",fontSize:15,fontWeight:600,color:C.textMuted,letterSpacing:2,marginBottom:14}}>SERVICE DEPARTMENT DASHBOARD</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(100px, 1fr))",gap:8,marginBottom:20}}>
          {[{l:"TOTAL JOBS",v:st.total,c:"#1a1a1a"},{l:"OPEN",v:st.open,c:"#d97706"},{l:"IN PROGRESS",v:st.ip,c:"#2563eb"},{l:"COMPLETED",v:st.comp,c:"#16a34a"},{l:"ON HOLD",v:st.oh,c:"#d97706"},{l:"PARTS NEEDED",v:st.wp,c:"#7e22ce"},{l:"P1 CRITICAL",v:st.p1,c:"#c0272d"},{l:"HOURS QUEUED",v:st.hrs.toFixed(1),c:"#0e7490"}].map(s=><div key={s.l} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:14,textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}><div style={{fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:9,color:C.textDim,fontFamily:"'DM Mono',monospace",letterSpacing:1,marginTop:4}}>{s.l}</div></div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:14}}>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:18}}>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:C.textMuted,letterSpacing:2,marginBottom:14}}>TECH UTILIZATION</div>
            {TECHS.map(t=>{const h=jobs.filter(j=>j.assignedTech===t.id&&j.status!=="COMPLETED").reduce((s,j)=>s+(j.estHours||0),0);const p=Math.min((h/8)*100,100);return<div key={t.id} style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,fontWeight:600,color:t.color,fontFamily:"'DM Mono',monospace"}}>{t.name.toUpperCase()}</span><span style={{fontSize:11,color:C.textMuted,fontFamily:"'DM Mono',monospace"}}>{h.toFixed(1)}h / 8h</span></div><div style={{height:8,background:C.card,borderRadius:4,overflow:"hidden"}}><div style={{width:`${p}%`,height:"100%",background:p>90?"#dc2626":t.color,borderRadius:4,transition:"width 0.3s"}} /></div></div>})}
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:18}}>
            <div style={{fontFamily:"'Oswald',sans-serif",fontSize:13,fontWeight:600,color:C.textMuted,letterSpacing:2,marginBottom:14}}>PARTS BOTTLENECKS</div>
            {jobs.filter(j=>j.partsStatus==="WAITING FOR PARTS"&&j.status!=="COMPLETED").map(j=>{const t=TECHS.find(x=>x.id===j.assignedTech);return<div key={j.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:C.card,borderRadius:6,marginBottom:5,fontSize:11,border:`1px solid ${C.border}`}}><span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:C.accent,fontWeight:600}}>{j.jobId}</span><span style={{color:C.black,fontWeight:600}}>{j.customer}</span><span style={{color:C.textMuted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{j.jobDesc||j.jobType}</span><PtB ps={j.partsStatus} />{t&&<span style={{color:t.color,fontWeight:600,fontFamily:"'DM Mono',monospace",fontSize:10}}>{t.name}</span>}</div>})}
            {jobs.filter(j=>j.partsStatus==="WAITING FOR PARTS"&&j.status!=="COMPLETED").length===0&&<div style={{color:"#16a34a",fontSize:12,textAlign:"center",padding:18,fontFamily:"'DM Mono',monospace"}}>✓ ALL PARTS ACCOUNTED FOR</div>}
          </div>
        </div>
      </>}
    </div>

    {showAdd&&<JobForm title="ADD NEW JOB" initial={{jobId:"",customer:"",unitType:"OFFROAD",jobType:"CUSTOMER PAY",jobDesc:"",skillNeeded:"INTERMEDIATE",flatRate:"MEDIUM (2-4 HRS)",partsStatus:"ALL PARTS IN",priority:"P2",assignedTech:"",status:"NOT_STARTED",estHours:"",notes:"",dateAdded:new Date().toISOString().split("T")[0]}} onSubmit={d=>{add(d);setShowAdd(false)}} onClose={()=>setShowAdd(false)} />}
    {editJ&&<JobForm title={`EDIT — RO# ${editJ.jobId}`} initial={{...editJ,estHours:String(editJ.estHours||"")}} onSubmit={d=>{updFull(editJ.id,d);setEditJ(null)}} onClose={()=>setEditJ(null)} onDelete={()=>{del(editJ.id);setEditJ(null)}} />}

    <div style={{borderTop:`1px solid ${C.border}`,padding:"10px 20px",textAlign:"center",color:C.textDim,fontSize:10,fontFamily:"'DM Mono',monospace",letterSpacing:1,background:C.white}}>PERFORMANCE EAST INC · SERVICE DISPATCH · GOLDSBORO, NC 27534</div>
  </div>;
}
