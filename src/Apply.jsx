import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import ServiceSelector from "./ServiceSelector";
import logo from "./assets/logo.jpg";

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
.font-display { font-family: 'Space Grotesk', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
.font-mono { font-family: 'IBM Plex Mono', monospace; }
`;

const EMPTY_FORM = {
  firstName: "", lastName: "", phone: "", email: "", city: "", services: [], locations: [], hasVehicle: null,
};

const LOCATIONS = ["Bronx", "Queens", "Brooklyn", "Manhattan", "Nassau County", "Suffolk County"];

function inputCls(error) {
  return `w-full border rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${error ? "border-red-300" : "border-slate-200"}`;
}

export default function Apply() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName) e.firstName = "Required";
    if (!form.lastName) e.lastName = "Required";
    if (!form.phone) e.phone = "Required";
    else if (!/^\+?[0-9]{10,15}$/.test(form.phone.replace(/[\s()-]/g, ""))) e.phone = "Use format +15125550182";
    if (form.services.length === 0) e.services = "Select at least one service";
    if (form.locations.length === 0) e.locations = "Select at least one area";
    if (form.hasVehicle === null) e.hasVehicle = "Please answer";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      const cleanPhone = form.phone.replace(/[\s()-]/g, "");
      const phone = cleanPhone.startsWith("+") ? cleanPhone : `+1${cleanPhone}`;
      await addDoc(collection(db, "technicians"), {
        firstName: form.firstName,
        lastName: form.lastName,
        phone,
        email: form.email,
        city: form.city,
        services: form.services,
        locations: form.locations,
        hasVehicle: form.hasVehicle,
        status: "pending",
      });
      setSubmitted(true);
    } catch (e) {
      setError(e.message);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] font-body flex items-center justify-center p-5">
        <style>{FONT_IMPORT}</style>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
          <h1 className="font-display text-xl font-semibold text-[#0A2540] mb-2">Application received</h1>
          <p className="text-slate-500 text-sm mb-4">
            Thanks, {form.firstName}! Your profile is in for review. Once approved, you'll get a WhatsApp message with your first job offer instructions.
          </p>
          <p className="text-xs text-slate-400">You can close this page now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-body flex items-center justify-center p-5">
      <style>{FONT_IMPORT}</style>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 max-w-lg w-full overflow-hidden my-8">
        <div className="bg-[#0A2540] p-6 text-white">
          <img src={logo} alt="Spife Clean" className="h-8 w-8 rounded-lg object-cover" />
          <h1 className="font-display font-semibold text-xl mt-2">Join Spife Clean</h1>
          <p className="text-slate-300 text-sm mt-1">Apply to become a technician. We'll review your info before activating your account.</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input value={form.firstName} onChange={set("firstName")} placeholder="First Name" className={inputCls(errors.firstName)} />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <input value={form.lastName} onChange={set("lastName")} placeholder="Last Name" className={inputCls(errors.lastName)} />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>
          <div>
            <input value={form.phone} onChange={set("phone")} placeholder="Phone (e.g. +15125550182)" className={inputCls(errors.phone)} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
          <input value={form.email} onChange={set("email")} placeholder="Email (optional)" className={inputCls()} />
          <input value={form.city} onChange={set("city")} placeholder="City" className={inputCls()} />

          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-2">Services You Perform</p>
            <p className="text-xs text-slate-400 mb-2">Tap a category to expand it, then check everything you're able to do.</p>
            <ServiceSelector selected={form.services} onChange={(services) => setForm((f) => ({ ...f, services }))} />
            {errors.services && <p className="text-red-500 text-xs mt-1">{errors.services}</p>}
          </div>

          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-2">Areas You Can Work</p>
            <div className="flex flex-wrap gap-2">
              {LOCATIONS.map((loc) => {
                const selected = form.locations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        locations: selected ? f.locations.filter((l) => l !== loc) : [...f.locations, loc],
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selected ? "bg-[#0B5FFF] border-[#0B5FFF] text-white" : "bg-white border-slate-200 text-slate-500"}`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
            {errors.locations && <p className="text-red-500 text-xs mt-1">{errors.locations}</p>}
          </div>

          <div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wide mb-2">Do you have your own vehicle?</p>
            <div className="flex gap-2">
              {[{ label: "Yes", value: true }, { label: "No", value: false }].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, hasVehicle: opt.value }))}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${form.hasVehicle === opt.value ? "bg-[#0B5FFF] border-[#0B5FFF] text-white" : "bg-white border-slate-200 text-slate-500"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.hasVehicle && <p className="text-red-500 text-xs mt-1">{errors.hasVehicle}</p>}
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#0B5FFF] hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3.5 rounded-xl text-sm active:scale-[0.98] transition-all"
          >
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}
