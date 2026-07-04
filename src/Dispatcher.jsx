import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import ServiceSelector from "./ServiceSelector";
import { SERVICE_CATEGORIES } from "./services";

// ============================================================
// CONFIG
// ============================================================

const DURATIONS = ["1 hour", "1.5 hours", "2 hours", "2.5 hours", "3 hours", "3.5 hours", "4 hours", "5 hours", "6 hours", "8 hours"];

// These match the exact status strings the technician app (App.jsx / STATUS_FLOW) writes and reads.
const STATUS_FLOW = ["Accepted", "En Route", "Arrived", "In Progress", "Completed"];

const EMPTY_JOB_FORM = {
  customerName: "", customerPhone: "", address: "", city: "", state: "", zip: "",
  date: "", time: "", duration: "2 hours", serviceType: "",
  description: "", payout: "",
};

const EMPTY_TECH_FORM = {
  firstName: "", lastName: "", phone: "", email: "", city: "", services: [],
};

// ============================================================
// UTILITIES
// ============================================================

function Badge({ status }) {
  const map = {
    Offered: "bg-amber-100 text-amber-700 border border-amber-200",
    Accepted: "bg-blue-100 text-blue-700 border border-blue-200",
    "En Route": "bg-blue-100 text-blue-700 border border-blue-200",
    Arrived: "bg-blue-100 text-blue-700 border border-blue-200",
    "In Progress": "bg-indigo-100 text-indigo-700 border border-indigo-200",
    Declined: "bg-red-100 text-red-600 border border-red-200",
    Completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border border-amber-200",
  };
  const labels = { active: "Active", pending: "Pending Approval" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || "bg-slate-100 text-slate-500"}`}>
      {labels[status] || status}
    </span>
  );
}

function Avatar({ name, size = "md" }) {
  const initials = (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "lg" ? "w-12 h-12 text-lg" : size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

function Toast({ message, type = "success", onClose }) {
  return (
    <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm">
      <span className="text-lg">{type === "error" ? "⚠️" : "✅"}</span>
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="text-slate-400 ml-2">✕</button>
    </div>
  );
}

function StatCard({ label, value, icon, sub, color = "text-slate-800" }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function inputCls(error) {
  return `w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${error ? "border-red-300" : "border-slate-200"}`;
}

// ============================================================
// DISPATCH FORM MODAL
// ============================================================

function DispatchModal({ technicians, onClose, onDispatch, sending }) {
  const [form, setForm] = useState(EMPTY_JOB_FORM);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Techs who list this service type surface first, but any active tech can still be picked.
  const qualifiedTechs = technicians.filter((t) => (t.services || []).includes(form.serviceType));
  const otherTechs = technicians.filter((t) => !(t.services || []).includes(form.serviceType));

  const validateStep1 = () => {
    const e = {};
    if (!form.customerName) e.customerName = "Required";
    if (!form.address) e.address = "Required";
    if (!form.date) e.date = "Required";
    if (!form.time) e.time = "Required";
    if (!form.payout || isNaN(form.payout)) e.payout = "Enter a valid amount";
    if (!form.serviceType) e.serviceType = "Select a service";
    if (!selectedTechId) e.tech = "Select a technician";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setErrors({});
      setStep(2);
    }
  };

  const selectedTech = technicians.find((t) => t.id === selectedTechId);
  const fullAddress = [form.address, form.city, form.state, form.zip].filter(Boolean).join(", ");

  const handleDispatch = () => {
    onDispatch(form, selectedTech, fullAddress);
  };

  const stepLabels = ["Job Details", "Confirm & Send"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">Dispatch New Job</h2>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">✕</button>
          </div>
          <div className="flex items-center gap-2">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i + 1 <= step ? "bg-white text-blue-600" : "bg-white/30 text-white"}`}>
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-semibold truncate ${i + 1 === step ? "text-white" : "text-blue-200"}`}>{label}</span>
                {i < stepLabels.length - 1 && <div className="flex-1 h-px bg-white/30 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Assign To" error={errors.tech}>
                <select value={selectedTechId} onChange={(e) => setSelectedTechId(e.target.value)} className={inputCls(errors.tech)}>
                  <option value="">Select a technician…</option>
                  {qualifiedTechs.length > 0 && (
                    <optgroup label={`Offers ${form.serviceType.includes(" > ") ? form.serviceType.split(" > ")[1] : form.serviceType}`}>
                      {qualifiedTechs.map((t) => (
                        <option key={t.id} value={t.id}>{t.firstName} {t.lastName} — {t.phone}</option>
                      ))}
                    </optgroup>
                  )}
                  {otherTechs.length > 0 && (
                    <optgroup label="Other technicians">
                      {otherTechs.map((t) => (
                        <option key={t.id} value={t.id}>{t.firstName} {t.lastName} — {t.phone}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {technicians.length === 0 && <p className="text-xs text-amber-600 mt-1">No technicians yet — add one in the Technicians tab first.</p>}
              </Field>

              <Field label="Customer Name" error={errors.customerName}>
                <input value={form.customerName} onChange={set("customerName")} placeholder="e.g. Sarah Mitchell" className={inputCls(errors.customerName)} />
              </Field>
              <Field label="Customer Phone">
                <input value={form.customerPhone} onChange={set("customerPhone")} placeholder="Optional" className={inputCls()} />
              </Field>
              <Field label="Property Address" error={errors.address}>
                <input value={form.address} onChange={set("address")} placeholder="Street address" className={inputCls(errors.address)} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="City"><input value={form.city} onChange={set("city")} className={inputCls()} /></Field>
                <Field label="State"><input value={form.state} onChange={set("state")} className={inputCls()} /></Field>
                <Field label="Zip"><input value={form.zip} onChange={set("zip")} className={inputCls()} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date" error={errors.date}>
                  <input value={form.date} onChange={set("date")} placeholder="Jul 5, 2026" className={inputCls(errors.date)} />
                </Field>
                <Field label="Time" error={errors.time}>
                  <input value={form.time} onChange={set("time")} placeholder="9:00 AM" className={inputCls(errors.time)} />
                </Field>
              </div>
              <Field label="Service Type" error={errors.serviceType}>
                <select value={form.serviceType} onChange={set("serviceType")} className={inputCls(errors.serviceType)}>
                  <option value="">Select a service…</option>
                  {SERVICE_CATEGORIES.map(({ category, items }) => (
                    <optgroup key={category} label={category}>
                      {items.map((item) => {
                        const key = `${category} > ${item}`;
                        return <option key={key} value={key}>{item}</option>;
                      })}
                    </optgroup>
                  ))}
                </select>
              </Field>
              <Field label="Duration">
                <select value={form.duration} onChange={set("duration")} className={inputCls()}>
                  {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Payout ($)" error={errors.payout}>
                <input value={form.payout} onChange={set("payout")} placeholder="120" type="number" min="0" className={inputCls(errors.payout)} />
              </Field>
              <Field label="Notes / Description (optional)">
                <textarea value={form.description} onChange={set("description")} rows={3} placeholder="Special instructions, access notes, pet info…" className={`${inputCls()} resize-none`} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">Job Summary</p>
                <div className="space-y-2 text-sm">
                  {[
                    ["Assigned To", selectedTech ? `${selectedTech.firstName} ${selectedTech.lastName}` : "—"],
                    ["Customer", form.customerName],
                    ["Address", fullAddress],
                    ["Date & Time", `${form.date} at ${form.time}`],
                    ["Service", form.serviceType.includes(" > ") ? form.serviceType.split(" > ")[1] : form.serviceType],
                    ["Duration", form.duration],
                    ["Payout", `$${parseFloat(form.payout || 0).toFixed(2)}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-slate-500 flex-shrink-0">{k}</span>
                      <span className="font-semibold text-slate-800 text-right">{v}</span>
                    </div>
                  ))}
                  {form.description && (
                    <div className="pt-2 border-t border-blue-100">
                      <span className="text-slate-500 block mb-1">Notes</span>
                      <span className="text-slate-700 text-xs">{form.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedTech && (
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <Avatar name={`${selectedTech.firstName} ${selectedTech.lastName}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{selectedTech.firstName} {selectedTech.lastName}</p>
                    <p className="text-xs text-slate-400">{selectedTech.phone}</p>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                📲 They'll get a WhatsApp notification the moment you send this.
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex gap-3 flex-shrink-0">
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)} className="flex-1 border border-slate-200 text-slate-600 font-bold py-3 rounded-xl text-sm">
              ← Back
            </button>
          )}
          {step < 2 ? (
            <button onClick={handleNext} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-all">
              Continue →
            </button>
          ) : (
            <button onClick={handleDispatch} disabled={sending} className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-sm active:scale-95 transition-all">
              {sending ? "Sending…" : "🚀 Send Job"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TECHNICIAN MANAGEMENT
// ============================================================

function TechnicianRow({ tech, jobsCompleted, onApprove }) {
  const isPending = tech.status === "pending";
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-xl">
      <Avatar name={`${tech.firstName} ${tech.lastName}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-800 text-sm">{tech.firstName} {tech.lastName}</p>
          <Badge status={tech.status || "active"} />
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{tech.phone}{tech.city ? ` · ${tech.city}` : ""}</p>
        {(tech.services || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tech.services.slice(0, 2).map((s) => (
              <span key={s} className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">{s}</span>
            ))}
            {tech.services.length > 2 && <span className="text-xs text-slate-400">+{tech.services.length - 2} more</span>}
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        {isPending ? (
          <button
            onClick={() => onApprove(tech.id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg active:scale-95 transition-all"
          >
            ✓ Approve
          </button>
        ) : (
          <p className="text-xs text-slate-400">{jobsCompleted} job{jobsCompleted !== 1 ? "s" : ""} done</p>
        )}
      </div>
    </div>
  );
}

function AddTechnicianForm({ onAdd }) {
  const [form, setForm] = useState(EMPTY_TECH_FORM);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.firstName || !form.phone) return;
    onAdd({ ...form, status: "active" });
    setForm(EMPTY_TECH_FORM);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <p className="text-sm font-bold text-slate-700">Add Technician</p>
      <p className="text-xs text-slate-400 -mt-2">Added here goes live immediately. Techs who self-apply at /apply need approval below instead.</p>
      <div className="grid grid-cols-2 gap-3">
        <input value={form.firstName} onChange={set("firstName")} placeholder="First Name" className={inputCls()} />
        <input value={form.lastName} onChange={set("lastName")} placeholder="Last Name" className={inputCls()} />
        <input value={form.phone} onChange={set("phone")} placeholder="Phone (e.g. +15125550182)" className={inputCls()} />
        <input value={form.email} onChange={set("email")} placeholder="Email (optional)" className={inputCls()} />
        <input value={form.city} onChange={set("city")} placeholder="City (optional)" className={inputCls()} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Services Offered</p>
        <ServiceSelector selected={form.services} onChange={(services) => setForm((f) => ({ ...f, services }))} />
      </div>
      <button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm">
        Add Technician
      </button>
    </div>
  );
}

// ============================================================
// JOB BOARD
// ============================================================

function JobRow({ job, tech, isLast }) {
  return (
    <div className={`flex items-center gap-4 p-4 ${!isLast ? "border-b border-slate-50" : ""} hover:bg-slate-50 transition-colors`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge status={job.status} />
        </div>
        <p className="font-semibold text-slate-800 text-sm mt-0.5">{job.customerName}</p>
        <p className="text-xs text-slate-500">{job.serviceType && job.serviceType.includes(" > ") ? job.serviceType.split(" > ")[1] : job.serviceType} · {job.date}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-slate-700 text-sm">${Number(job.payout || 0).toFixed(0)}</p>
        <p className="text-xs text-slate-400 mt-0.5">{tech ? tech.firstName : "Unassigned"}</p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function Dispatcher() {
  const [page, setPage] = useState("dashboard");
  const [showDispatch, setShowDispatch] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [toast, setToast] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsubTechs = onSnapshot(collection(db, "technicians"), (snap) => {
      setTechnicians(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubJobs = onSnapshot(query(collection(db, "jobs"), orderBy("createdAt", "desc")), (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubTechs();
      unsubJobs();
    };
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAddTech = async (techForm) => {
    try {
      await addDoc(collection(db, "technicians"), techForm);
      showToast(`${techForm.firstName} added.`);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleApproveTech = async (techId) => {
    try {
      await updateDoc(doc(db, "technicians", techId), { status: "active" });
      const tech = technicians.find((t) => t.id === techId);
      showToast(`${tech?.firstName || "Technician"} approved.`);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleDispatch = async (form, tech, fullAddress) => {
    if (!tech) return;
    setSending(true);
    try {
      const jobRef = await addDoc(collection(db, "jobs"), {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        address: fullAddress,
        date: form.date,
        time: form.time,
        duration: form.duration,
        serviceType: form.serviceType,
        description: form.description,
        payout: parseFloat(form.payout),
        technicianId: tech.id,
        status: "Offered",
        createdAt: serverTimestamp(),
      });

      const res = await fetch("/.netlify/functions/send-job-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techPhone: tech.phone,
          techName: tech.firstName,
          jobId: jobRef.id,
          address: fullAddress,
          date: form.date,
          time: form.time,
          serviceType: form.serviceType,
          payout: form.payout,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(`Job saved, but notification failed to send: ${err.error || res.statusText}`, "error");
      } else {
        showToast(`Job sent to ${tech.firstName}.`);
      }
      setShowDispatch(false);
    } catch (e) {
      showToast(e.message, "error");
    }
    setSending(false);
  };

  const jobsCompletedFor = (techId) => jobs.filter((j) => j.technicianId === techId && j.status === "Completed").length;

  const stats = {
    total: jobs.length,
    offered: jobs.filter((j) => j.status === "Offered").length,
    active: jobs.filter((j) => STATUS_FLOW.slice(0, -1).includes(j.status)).length,
    completed: jobs.filter((j) => j.status === "Completed").length,
    revenue: jobs.filter((j) => j.status === "Completed").reduce((s, j) => s + Number(j.payout || 0), 0),
  };

  const filteredJobs = filterStatus === "all" ? jobs : jobs.filter((j) => j.status === filterStatus);
  const allStatuses = ["Offered", ...STATUS_FLOW, "Declined"];

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "technicians", label: "Technicians", icon: "👥" },
    { id: "jobs", label: "All Jobs", icon: "🗂" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🧹</span>
          <div>
            <span className="font-bold text-slate-800 text-base tracking-tight">Spife Clean</span>
            <span className="ml-2 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Dispatcher</span>
          </div>
        </div>
        <button onClick={() => setShowDispatch(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 active:scale-95 transition-all shadow-sm">
          <span>+</span> Dispatch Job
        </button>
      </header>

      <nav className="bg-white border-b border-slate-100 px-4 flex gap-1 overflow-x-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${page === item.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-5 max-w-4xl mx-auto w-full">
        {page === "dashboard" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Overview</h1>
              <p className="text-slate-500 text-sm mt-0.5">{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Jobs" value={stats.total} icon="🗂" sub="all time" />
              <StatCard label="Awaiting Response" value={stats.offered} icon="⏳" sub="needs action" color="text-amber-600" />
              <StatCard label="Active Jobs" value={stats.active} icon="🔵" sub="in progress" color="text-blue-600" />
              <StatCard label="Revenue Paid" value={`$${stats.revenue.toFixed(0)}`} icon="💰" sub="completed jobs" color="text-emerald-600" />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Recent Jobs</h3>
                <button onClick={() => setPage("jobs")} className="text-blue-600 text-sm font-semibold">View all →</button>
              </div>
              {jobs.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">No jobs dispatched yet.</p>
              ) : (
                jobs.slice(0, 5).map((job, i) => (
                  <JobRow key={job.id} job={job} tech={technicians.find((t) => t.id === job.technicianId)} isLast={i === Math.min(4, jobs.length - 1)} />
                ))
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Technicians</h3>
                <button onClick={() => setPage("technicians")} className="text-blue-600 text-sm font-semibold">Manage →</button>
              </div>
              {technicians.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">No technicians yet.</p>
              ) : (
                technicians.map((tech, i, arr) => (
                  <div key={tech.id} className={i !== arr.length - 1 ? "border-b border-slate-50" : ""}>
                    <TechnicianRow tech={tech} jobsCompleted={jobsCompletedFor(tech.id)} onApprove={handleApproveTech} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {page === "technicians" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Technicians</h1>
              <p className="text-slate-500 text-sm mt-0.5">{technicians.length} total</p>
            </div>
            <AddTechnicianForm onAdd={handleAddTech} />

            {technicians.filter((t) => t.status === "pending").length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-amber-100">
                  <p className="font-bold text-amber-800 text-sm">
                    ⏳ {technicians.filter((t) => t.status === "pending").length} pending approval
                  </p>
                  <p className="text-amber-600 text-xs mt-0.5">Applied via the self-signup link. Review and approve to activate.</p>
                </div>
                {technicians.filter((t) => t.status === "pending").map((tech, i, arr) => (
                  <div key={tech.id} className={i !== arr.length - 1 ? "border-b border-amber-100" : ""}>
                    <TechnicianRow tech={tech} jobsCompleted={jobsCompletedFor(tech.id)} onApprove={handleApproveTech} />
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {technicians.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">None yet — add one above.</p>
              ) : (
                technicians.map((tech, i) => (
                  <div key={tech.id} className={i !== technicians.length - 1 ? "border-b border-slate-50" : ""}>
                    <TechnicianRow tech={tech} jobsCompleted={jobsCompletedFor(tech.id)} onApprove={handleApproveTech} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {page === "jobs" && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">All Jobs</h1>
              <p className="text-slate-500 text-sm mt-0.5">{jobs.length} total dispatches</p>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${filterStatus === "all" ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"}`}
              >
                All ({jobs.length})
              </button>
              {allStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${filterStatus === s ? "bg-blue-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"}`}
                >
                  {s} ({jobs.filter((j) => j.status === s).length})
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {filteredJobs.length === 0 ? (
                <div className="p-10 text-center">
                  <span className="text-4xl">🗂</span>
                  <p className="text-slate-500 text-sm mt-3">No jobs{filterStatus !== "all" ? ` with status "${filterStatus}"` : ""}</p>
                </div>
              ) : (
                filteredJobs.map((job, i) => (
                  <JobRow key={job.id} job={job} tech={technicians.find((t) => t.id === job.technicianId)} isLast={i === filteredJobs.length - 1} />
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {showDispatch && (
        <DispatchModal
          technicians={technicians.filter((t) => (t.status || "active") === "active")}
          onClose={() => setShowDispatch(false)}
          onDispatch={handleDispatch}
          sending={sending}
        />
      )}
    </div>
  );
}
