import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, query, where, getDocs, onSnapshot, orderBy, serverTimestamp,
} from "firebase/firestore";
import { SERVICE_CATEGORIES } from "./services";
import logo from "./assets/logo.jpg";

const DURATIONS = ["1 hour", "1.5 hours", "2 hours", "2.5 hours", "3 hours", "3.5 hours", "4 hours", "5 hours", "6 hours", "8 hours"];
const STATUS_FLOW = ["Requested", "Offered", "Accepted", "En Route", "Arrived", "In Progress", "Completed"];

function inputCls(error) {
  return `w-full border rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${error ? "border-red-300" : "border-slate-200"}`;
}

function Badge({ status }) {
  const map = {
    Requested: "bg-slate-100 text-slate-600 border border-slate-200",
    Offered: "bg-amber-100 text-amber-700 border border-amber-200",
    Accepted: "bg-blue-100 text-blue-700 border border-blue-200",
    "En Route": "bg-blue-100 text-blue-700 border border-blue-200",
    Arrived: "bg-blue-100 text-blue-700 border border-blue-200",
    "In Progress": "bg-indigo-100 text-indigo-700 border border-indigo-200",
    Declined: "bg-red-100 text-red-600 border border-red-200",
    Completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

// ============================================================
// LOGIN / SIGNUP
// ============================================================

function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [signupForm, setSignupForm] = useState({ firstName: "", lastName: "", email: "" });

  const normalizePhone = (p) => {
    const clean = p.replace(/[\s()-]/g, "");
    return clean.startsWith("+") ? clean : `+1${clean}`;
  };

  const handleCheck = async () => {
    if (!phone) return;
    setChecking(true);
    setError("");
    try {
      const p = normalizePhone(phone);
      const q = query(collection(db, "customers"), where("phone", "==", p));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const customerDoc = snap.docs[0];
        onLogin({ id: customerDoc.id, ...customerDoc.data() });
      } else {
        setNotFound(true);
      }
    } catch (e) {
      setError(e.message);
    }
    setChecking(false);
  };

  const handleSignup = async () => {
    if (!signupForm.firstName || !signupForm.lastName) return;
    setChecking(true);
    setError("");
    try {
      const p = normalizePhone(phone);
      const docRef = await addDoc(collection(db, "customers"), {
        firstName: signupForm.firstName,
        lastName: signupForm.lastName,
        email: signupForm.email,
        phone: p,
        createdAt: serverTimestamp(),
      });
      onLogin({ id: docRef.id, firstName: signupForm.firstName, lastName: signupForm.lastName, email: signupForm.email, phone: p });
    } catch (e) {
      setError(e.message);
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 max-w-sm w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white text-center">
          <img src={logo} alt="Spife Clean" className="h-8 w-8 rounded-lg object-cover mx-auto" />
          <h1 className="font-bold text-xl mt-2">Spife Clean</h1>
          <p className="text-blue-100 text-sm mt-1">Book a cleaning, track your job, pay when it's done.</p>
        </div>
        <div className="p-6 space-y-4">
          {!notFound ? (
            <>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (e.g. +15125550182)"
                className={inputCls()}
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button onClick={handleCheck} disabled={checking} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-sm">
                {checking ? "Checking…" : "Continue"}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">First time here — let's set up your profile.</p>
              <input value={signupForm.firstName} onChange={(e) => setSignupForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="First Name" className={inputCls()} />
              <input value={signupForm.lastName} onChange={(e) => setSignupForm((f) => ({ ...f, lastName: e.target.value }))} placeholder="Last Name" className={inputCls()} />
              <input value={signupForm.email} onChange={(e) => setSignupForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email (optional)" className={inputCls()} />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <button onClick={handleSignup} disabled={checking} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl text-sm">
                {checking ? "Creating…" : "Create Profile & Continue"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BOOKING FORM
// ============================================================

function BookingForm({ customer, onBooked }) {
  const EMPTY = { address: "", city: "", state: "", zip: "", date: "", time: "", duration: "2 hours", serviceType: "", description: "" };
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.address) e.address = "Required";
    if (!form.date) e.date = "Required";
    if (!form.time) e.time = "Required";
    if (!form.serviceType) e.serviceType = "Select a service";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const fullAddress = [form.address, form.city, form.state, form.zip].filter(Boolean).join(", ");
      await addDoc(collection(db, "jobs"), {
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerPhone: customer.phone,
        address: fullAddress,
        date: form.date,
        time: form.time,
        duration: form.duration,
        serviceType: form.serviceType,
        description: form.description,
        technicianId: null,
        payout: null,
        paymentStatus: "unpaid",
        status: "Requested",
        createdAt: serverTimestamp(),
      });

      const serviceName = form.serviceType.includes(" > ") ? form.serviceType.split(" > ")[1] : form.serviceType;
      fetch("/.netlify/functions/notify-new-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: `${customer.firstName} ${customer.lastName}`,
          address: fullAddress,
          date: form.date,
          time: form.time,
          serviceType: serviceName,
          description: form.description,
        }),
      }).catch(() => {
        // Booking already saved either way — a failed notification shouldn't block the customer's confirmation.
      });

      setDone(true);
      setForm(EMPTY);
      if (onBooked) onBooked();
    } catch (e) {
      setErrors({ submit: e.message });
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-3">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl mx-auto">✅</div>
        <p className="font-bold text-slate-800">Request sent!</p>
        <p className="text-sm text-slate-500">We'll review it and get you a price + technician shortly. Check "My Jobs" for updates.</p>
        <button onClick={() => setDone(false)} className="text-blue-600 text-sm font-semibold">Book another →</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Address</label>
        <input value={form.address} onChange={set("address")} placeholder="Street address" className={inputCls(errors.address)} />
        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <input value={form.city} onChange={set("city")} placeholder="City" className={inputCls()} />
        <input value={form.state} onChange={set("state")} placeholder="State" className={inputCls()} />
        <input value={form.zip} onChange={set("zip")} placeholder="Zip" className={inputCls()} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Date</label>
          <input value={form.date} onChange={set("date")} placeholder="Jul 10, 2026" className={inputCls(errors.date)} />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Time</label>
          <input value={form.time} onChange={set("time")} placeholder="9:00 AM" className={inputCls(errors.time)} />
          {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Service Needed</label>
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
        {errors.serviceType && <p className="text-red-500 text-xs mt-1">{errors.serviceType}</p>}
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Estimated Duration</label>
        <select value={form.duration} onChange={set("duration")} className={inputCls()}>
          {DURATIONS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
        <textarea value={form.description} onChange={set("description")} rows={3} placeholder="Access instructions, pets, special requests…" className={`${inputCls()} resize-none`} />
      </div>
      {errors.submit && <p className="text-red-500 text-xs">{errors.submit}</p>}
      <button onClick={handleSubmit} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl text-sm active:scale-95 transition-all">
        {submitting ? "Sending…" : "Request Booking"}
      </button>
    </div>
  );
}

// ============================================================
// JOB TRACKING + PAYMENT
// ============================================================

function JobCard({ job }) {
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const currentIdx = STATUS_FLOW.indexOf(job.status);
  const serviceName = job.serviceType && job.serviceType.includes(" > ") ? job.serviceType.split(" > ")[1] : job.serviceType;

  const handlePay = async () => {
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          amount: job.payout,
          customerEmail: job.customerEmail || "",
          description: `Spife Clean — ${serviceName || "Cleaning Service"}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setPayError(data.error || "Could not start checkout");
        setPaying(false);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setPayError(e.message);
      setPaying(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Badge status={job.status} />
        {job.payout != null && (
          <span className="font-bold text-slate-700 text-sm">${Number(job.payout).toFixed(2)}</span>
        )}
      </div>
      <div>
        <p className="font-semibold text-slate-800 text-sm">{serviceName || "Service"}</p>
        <p className="text-xs text-slate-500 mt-0.5">{job.date} · {job.time}</p>
        <p className="text-xs text-slate-500">{job.address}</p>
      </div>

      {job.status !== "Requested" && job.status !== "Declined" && (
        <div className="pt-1">
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.max(0, (currentIdx / (STATUS_FLOW.length - 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {job.status === "Requested" && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">Waiting on us to confirm pricing and assign a technician.</p>
      )}

      {job.payout != null && job.paymentStatus !== "paid" && job.status !== "Requested" && job.status !== "Declined" && (
        <div>
          <button onClick={handlePay} disabled={paying} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl text-sm active:scale-95 transition-all">
            {paying ? "Redirecting…" : `💳 Pay $${Number(job.payout).toFixed(2)}`}
          </button>
          {payError && <p className="text-red-500 text-xs mt-1">{payError}</p>}
        </div>
      )}

      {job.paymentStatus === "paid" && (
        <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 font-semibold">✅ Paid</p>
      )}
    </div>
  );
}

function MyJobs({ customer }) {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "jobs"), where("customerId", "==", customer.id), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [customer.id]);

  if (jobs.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-10">No bookings yet — request one from the Book tab.</p>;
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => <JobCard key={job.id} job={job} />)}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function Client() {
  const [customer, setCustomer] = useState(null);
  const [tab, setTab] = useState("book");

  if (!customer) {
    return <LoginScreen onLogin={setCustomer} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>
      <header className="bg-white border-b border-slate-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Spife Clean" className="h-6 w-6 rounded object-cover" />
          <span className="font-bold text-slate-800 text-base tracking-tight">Spife Clean</span>
        </div>
        <span className="text-xs text-slate-400">{customer.firstName}</span>
      </header>

      <nav className="bg-white border-b border-slate-100 px-4 flex gap-1">
        {[{ id: "book", label: "Book a Job" }, { id: "jobs", label: "My Jobs" }].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex-1 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === item.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 p-5 max-w-lg mx-auto w-full">
        {tab === "book" && <BookingForm customer={customer} onBooked={() => setTab("jobs")} />}
        {tab === "jobs" && <MyJobs customer={customer} />}
      </main>
    </div>
  );
}
