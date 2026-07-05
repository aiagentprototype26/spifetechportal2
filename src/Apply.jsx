import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import ServiceSelector from "./ServiceSelector";
import logo from "./assets/logo.jpg";

const EMPTY_FORM = {
  firstName: "", lastName: "", phone: "", email: "", city: "", services: [],
};

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Application received</h1>
          <p className="text-slate-500 text-sm mb-4">
            Thanks, {form.firstName}! Your profile is in for review. Once approved, you'll get a WhatsApp message with your first job offer instructions.
          </p>
          <p className="text-xs text-slate-400">You can close this page now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 max-w-lg w-full overflow-hidden my-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <img src={logo} alt="Spife Clean" className="h-8 w-8 rounded-lg object-cover" />
          <h1 className="font-bold text-xl mt-2">Join Spife Clean</h1>
          <p className="text-blue-100 text-sm mt-1">Apply to become a technician. We'll review your info before activating your account.</p>
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
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Services You Perform</p>
            <p className="text-xs text-slate-400 mb-2">Tap a category to expand it, then check everything you're able to do.</p>
            <ServiceSelector selected={form.services} onChange={(services) => setForm((f) => ({ ...f, services }))} />
            {errors.services && <p className="text-red-500 text-xs mt-1">{errors.services}</p>}
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl text-sm active:scale-95 transition-all"
          >
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}
