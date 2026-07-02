import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";

const SERVICE_TYPES = ["Residential Cleaning", "Deep Cleaning", "Move-Out Cleaning", "Airbnb Turnover", "Commercial Cleaning"];

const emptyJob = {
  customerName: "",
  customerPhone: "",
  address: "",
  date: "",
  time: "",
  duration: "2 hours",
  serviceType: SERVICE_TYPES[0],
  description: "",
  payout: "",
};

const emptyTech = { firstName: "", lastName: "", phone: "", email: "" };

export default function Dispatcher() {
  const [tab, setTab] = useState("send"); // send | techs
  const [technicians, setTechnicians] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyJob);
  const [selectedTechId, setSelectedTechId] = useState("");
  const [newTech, setNewTech] = useState(emptyTech);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // {type: 'success'|'error', message}

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

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setT = (k) => (e) => setNewTech((f) => ({ ...f, [k]: e.target.value }));

  const handleAddTech = async () => {
    if (!newTech.firstName || !newTech.phone) {
      setStatus({ type: "error", message: "First name and phone are required." });
      return;
    }
    await addDoc(collection(db, "technicians"), newTech);
    setNewTech(emptyTech);
    setStatus({ type: "success", message: "Technician added." });
  };

  const handleSendJob = async () => {
    if (!selectedTechId) {
      setStatus({ type: "error", message: "Select a technician." });
      return;
    }
    if (!form.customerName || !form.address || !form.date || !form.time || !form.payout) {
      setStatus({ type: "error", message: "Fill in customer name, address, date, time, and payout." });
      return;
    }
    setSending(true);
    setStatus(null);
    try {
      const tech = technicians.find((t) => t.id === selectedTechId);

      const jobRef = await addDoc(collection(db, "jobs"), {
        ...form,
        payout: parseFloat(form.payout),
        technicianId: selectedTechId,
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
          address: form.address,
          date: form.date,
          time: form.time,
          serviceType: form.serviceType,
          payout: form.payout,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatus({ type: "error", message: `Job saved, but text failed to send: ${err.error || res.statusText}` });
      } else {
        setStatus({ type: "success", message: `Job created and texted to ${tech.firstName}.` });
        setForm(emptyJob);
        setSelectedTechId("");
      }
    } catch (e) {
      setStatus({ type: "error", message: e.message });
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧹</span>
          <span className="font-bold text-slate-800 text-sm">Spife Clean — Dispatcher</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white border-b border-slate-100 flex rounded-t-2xl overflow-hidden">
          {[
            ["send", "Send a Job"],
            ["techs", "Technicians"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 ${tab === id ? "text-blue-600 border-blue-600" : "text-slate-400 border-transparent"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {status && (
          <div className={`mt-4 rounded-xl p-3 text-sm ${status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
            {status.message}
          </div>
        )}

        {tab === "send" && (
          <div className="bg-white rounded-b-2xl p-5 space-y-4 shadow-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Assign To</label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a technician…</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} — {t.phone}
                  </option>
                ))}
              </select>
              {technicians.length === 0 && <p className="text-xs text-amber-600 mt-1">No technicians yet — add one in the Technicians tab first.</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Customer Name</label>
                <input value={form.customerName} onChange={set("customerName")} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Customer Phone</label>
                <input value={form.customerPhone} onChange={set("customerPhone")} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Address</label>
              <input value={form.address} onChange={set("address")} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Date</label>
                <input value={form.date} onChange={set("date")} placeholder="Jul 5, 2026" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Time</label>
                <input value={form.time} onChange={set("time")} placeholder="9:00 AM" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Payout ($)</label>
                <input value={form.payout} onChange={set("payout")} placeholder="120" type="number" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Service Type</label>
              <select value={form.serviceType} onChange={set("serviceType")} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {SERVICE_TYPES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Notes / Description</label>
              <textarea value={form.description} onChange={set("description")} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <button
              onClick={handleSendJob}
              disabled={sending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send Job & Text Technician"}
            </button>

            {jobs.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Recent Jobs</p>
                <div className="space-y-2">
                  {jobs.slice(0, 8).map((j) => {
                    const t = technicians.find((tt) => tt.id === j.technicianId);
                    return (
                      <div key={j.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-slate-600 truncate">
                          {j.customerName} — {t ? `${t.firstName} ${t.lastName}` : "unassigned"}
                        </span>
                        <span className="font-semibold text-slate-700">{j.status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "techs" && (
          <div className="bg-white rounded-b-2xl p-5 space-y-4 shadow-sm">
            <p className="text-sm text-slate-500">Add technicians here. They sign into the tech app with their phone number.</p>
            <div className="grid grid-cols-2 gap-3">
              <input value={newTech.firstName} onChange={setT("firstName")} placeholder="First Name" className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={newTech.lastName} onChange={setT("lastName")} placeholder="Last Name" className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={newTech.phone} onChange={setT("phone")} placeholder="Phone (e.g. +15125550182)" className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={newTech.email} onChange={setT("email")} placeholder="Email (optional)" className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handleAddTech} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm">
              Add Technician
            </button>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Current Technicians</p>
              {technicians.length === 0 && <p className="text-sm text-slate-400">None yet.</p>}
              {technicians.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                  <span className="font-semibold text-slate-700">
                    {t.firstName} {t.lastName}
                  </span>
                  <span className="text-slate-500 text-xs">{t.phone}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
