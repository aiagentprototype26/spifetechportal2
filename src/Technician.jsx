import React, { useEffect, useState } from "react";
import {
  collection, query, where, onSnapshot, orderBy,
  doc, updateDoc, runTransaction, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const STATUS_FLOW = ["Accepted", "En Route", "Arrived", "In Progress", "Completed"];
const SESSION_KEY = "spife_tech_session";

function serviceName(key) {
  return key && key.includes(" > ") ? key.split(" > ")[1] : key;
}

// ---------- Login ----------
function Login({ onLoggedIn }) {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setChecking(true);
    try {
      const cleanPhone = phone.replace(/[\s()-]/g, "");
      const normalized = cleanPhone.startsWith("+") ? cleanPhone : `+1${cleanPhone}`;

      const { getDocs, query: q, collection: col, where: w } = await import("firebase/firestore");
      const snap = await getDocs(q(col(db, "technicians"), w("phone", "==", normalized)));

      if (snap.empty) {
        setError("No technician found with that phone number.");
        setChecking(false);
        return;
      }
      const techDoc = snap.docs[0];
      const tech = { id: techDoc.id, ...techDoc.data() };

      if (tech.status !== "active") {
        setError("Your account isn't approved yet. Check with dispatch.");
        setChecking(false);
        return;
      }
      if (String(tech.pin) !== pin.trim()) {
        setError("Incorrect PIN.");
        setChecking(false);
        return;
      }

      const session = { id: tech.id, firstName: tech.firstName, phone: tech.phone };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      onLoggedIn(session);
    } catch (err) {
      setError(err.message);
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 w-full max-w-sm">
        <h1 className="text-xl font-bold text-slate-800 mb-1">Technician Login</h1>
        <p className="text-sm text-slate-500 mb-5">Spife Clean</p>
        <label className="text-xs font-semibold text-slate-500">Phone</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+15125550182"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 mb-3 text-sm"
        />
        <label className="text-xs font-semibold text-slate-500">PIN</label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="4-digit PIN"
          inputMode="numeric"
          maxLength={4}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 mt-1 mb-4 text-sm"
        />
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button
          disabled={checking}
          className="w-full bg-[#0B5FFF] text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-50"
        >
          {checking ? "Checking…" : "Log In"}
        </button>
        <p className="text-xs text-slate-400 mt-4 text-center">
          Your PIN was given to you when dispatch approved your application.
        </p>
      </form>
    </div>
  );
}

// ---------- Job card in the open pool ----------
function OpenJobCard({ job, onAccept, accepting }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-slate-800 text-sm">{serviceName(job.serviceType)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{job.address}</p>
          <p className="text-xs text-slate-500">{job.date} · {job.time} · {job.duration}</p>
        </div>
        {job.payout != null && (
          <span className="text-sm font-bold text-emerald-600">${Number(job.payout).toFixed(2)}</span>
        )}
      </div>
      {job.description && <p className="text-xs text-slate-400 mt-2">{job.description}</p>}
      <button
        onClick={() => onAccept(job)}
        disabled={accepting === job.id}
        className="w-full mt-3 bg-emerald-500 text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-50"
      >
        {accepting === job.id ? "Accepting…" : "Accept Job"}
      </button>
    </div>
  );
}

// ---------- Active job card ----------
function ActiveJobCard({ job, onAdvance, updating }) {
  const idx = STATUS_FLOW.indexOf(job.status);
  const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  const done = job.status === "Completed";

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-slate-800 text-sm">{serviceName(job.serviceType)}</p>
          <p className="text-xs text-slate-500 mt-0.5">{job.address}</p>
          <p className="text-xs text-slate-500">{job.date} · {job.time}</p>
          <p className="text-xs text-slate-400 mt-1">Customer: {job.customerName} · {job.customerPhone}</p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">{job.status}</span>
      </div>
      {job.payout != null && (
        <p className="text-sm font-bold text-emerald-600 mt-2">${Number(job.payout).toFixed(2)}</p>
      )}
      {!done && next && (
        <button
          onClick={() => onAdvance(job, next)}
          disabled={updating === job.id}
          className="w-full mt-3 bg-[#0B5FFF] text-white font-semibold rounded-lg py-2 text-sm disabled:opacity-50"
        >
          {updating === job.id ? "Updating…" : `Mark as ${next}`}
        </button>
      )}
      {done && <p className="text-xs text-emerald-600 font-semibold mt-3">✓ Job complete</p>}
    </div>
  );
}

// ---------- Main dashboard ----------
function Dashboard({ session, onLogout }) {
  const [tech, setTech] = useState(null);
  const [openJobs, setOpenJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const unsubTech = onSnapshot(doc(db, "technicians", session.id), (d) => {
      if (d.exists()) setTech({ id: d.id, ...d.data() });
    });
    const unsubOpen = onSnapshot(
      query(collection(db, "jobs"), where("status", "==", "Requested"), orderBy("createdAt", "desc")),
      (snap) => setOpenJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubMine = onSnapshot(
      query(collection(db, "jobs"), where("technicianId", "==", session.id), orderBy("createdAt", "desc")),
      (snap) => setMyJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { unsubTech(); unsubOpen(); unsubMine(); };
  }, [session.id]);

  const toggleOnline = async () => {
    try {
      await updateDoc(doc(db, "technicians", session.id), { online: !tech?.online });
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  // Atomic accept — first technician to grab it wins, others get a friendly rejection.
  const handleAccept = async (job) => {
    setAccepting(job.id);
    try {
      await runTransaction(db, async (tx) => {
        const jobRef = doc(db, "jobs", job.id);
        const snap = await tx.get(jobRef);
        if (!snap.exists() || snap.data().status !== "Requested") {
          throw new Error("Job already taken.");
        }
        tx.update(jobRef, {
          technicianId: session.id,
          technicianName: session.firstName,
          status: "Accepted",
          acceptedAt: serverTimestamp(),
        });
      });
      showToast("Job accepted!");
    } catch (e) {
      showToast(e.message, "error");
    }
    setAccepting(null);
  };

  const handleAdvance = async (job, nextStatus) => {
    setUpdating(job.id);
    try {
      await updateDoc(doc(db, "jobs", job.id), { status: nextStatus });
      showToast(`Marked ${nextStatus}.`);
    } catch (e) {
      showToast(e.message, "error");
    }
    setUpdating(null);
  };

  const matchingOpenJobs = tech
    ? openJobs.filter((j) => !tech.services || tech.services.length === 0 || tech.services.includes(j.serviceType))
    : openJobs;
  const activeJobs = myJobs.filter((j) => j.status !== "Completed" && j.status !== "Requested");
  const completedJobs = myJobs.filter((j) => j.status === "Completed");

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="font-bold text-slate-800">Hi, {session.firstName}</p>
          <p className="text-xs text-slate-400">Spife Clean · Technician</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleOnline}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
              tech?.online ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {tech?.online ? "🟢 Online" : "⚪ Offline"}
          </button>
          <button onClick={onLogout} className="text-xs text-slate-400 underline">Log out</button>
        </div>
      </div>

      {toast && (
        <div className={`mx-4 mt-3 rounded-lg px-3 py-2 text-sm ${toast.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
          {toast.msg}
        </div>
      )}

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {!tech?.online && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
            You're offline — go online to see and accept new jobs.
          </div>
        )}

        {activeJobs.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-700 mb-2">Active Jobs ({activeJobs.length})</h2>
            <div className="space-y-3">
              {activeJobs.map((job) => (
                <ActiveJobCard key={job.id} job={job} onAdvance={handleAdvance} updating={updating} />
              ))}
            </div>
          </section>
        )}

        {tech?.online && (
          <section>
            <h2 className="text-sm font-bold text-slate-700 mb-2">Open Jobs ({matchingOpenJobs.length})</h2>
            {matchingOpenJobs.length === 0 ? (
              <p className="text-sm text-slate-400">No open jobs right now. We'll notify you when one comes in.</p>
            ) : (
              <div className="space-y-3">
                {matchingOpenJobs.map((job) => (
                  <OpenJobCard key={job.id} job={job} onAccept={handleAccept} accepting={accepting} />
                ))}
              </div>
            )}
          </section>
        )}

        {completedJobs.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-slate-700 mb-2">Completed ({completedJobs.length})</h2>
            <p className="text-xs text-slate-400">
              Total earned: ${completedJobs.reduce((s, j) => s + Number(j.payout || 0), 0).toFixed(2)}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

export default function Technician() {
  // TEMP: PIN login disabled until new Firebase account is set up.
  // Placeholder identity — "my jobs" filtering won't reflect a real tech until login is restored.
  const [session] = useState({ id: "guest", firstName: "Guest", phone: "" });

  return <Dashboard session={session} onLogout={() => {}} />;

  /* eslint-disable no-unreachable */
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try { setSession(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setChecked(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  if (!checked) return null;
  return session
    ? <Dashboard session={session} onLogout={handleLogout} />
    : <Login onLoggedIn={setSession} />;
}
