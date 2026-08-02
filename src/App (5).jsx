import { useState, useEffect } from "react";
import { db } from "./firebase";
import logo from "./assets/logo.jpg";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
} from "firebase/firestore";

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
.font-display { font-family: 'Space Grotesk', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
.font-mono { font-family: 'IBM Plex Mono', monospace; }
`;

// ============================================================
// SHARED UI HELPERS
// ============================================================

function Badge({ status }) {
  const styles = {
    Approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    "Pending Review": "bg-amber-100 text-amber-700 border border-amber-200",
    "Not Uploaded": "bg-slate-100 text-slate-500 border border-slate-200",
    Accepted: "bg-blue-100 text-blue-700 border border-blue-200",
    "En Route": "bg-violet-100 text-violet-700 border border-violet-200",
    Arrived: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    "In Progress": "bg-orange-100 text-orange-700 border border-orange-200",
    Completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function Avatar({ name, size = "md" }) {
  const initials = (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "lg" ? "w-14 h-14 text-xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-[#0B5FFF] to-[#0A2540] flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

const STATUS_FLOW = ["Accepted", "En Route", "Arrived", "In Progress", "Completed"];

// ============================================================
// LOGIN (simple phone-number lookup against technicians collection)
// ============================================================

function LoginScreen({ onLogin }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!phone) {
      setError("Enter your phone number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const q = query(collection(db, "technicians"), where("phone", "==", phone.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError("No technician found with that phone number. Contact your dispatcher.");
        setLoading(false);
        return;
      }
      const techDoc = snap.docs[0];
      const tech = { id: techDoc.id, ...techDoc.data() };
      localStorage.setItem("spife_tech_id", tech.id);
      onLogin(tech);
    } catch (e) {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A2540] font-body flex items-center justify-center p-4">
      <style>{FONT_IMPORT}</style>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-2xl px-4 py-2 mb-4">
            <img src={logo} alt="Spife Clean" className="h-8 w-8 rounded-lg object-cover" />
            <span className="text-white font-display font-semibold text-xl tracking-tight">Spife Clean</span>
          </div>
          <p className="text-slate-300 text-sm">Technician Portal</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="font-display text-xl font-semibold text-[#0A2540] mb-1">Welcome</h2>
          <p className="text-slate-500 text-sm mb-6">Enter your phone number to sign in</p>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>}
          <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wide">Phone Number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-0100"
            type="tel"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#0B5FFF] hover:bg-blue-700 active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl mt-6 transition-all text-sm disabled:opacity-60"
          >
            {loading ? "Checking…" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NAVIGATION
// ============================================================

function BottomNav({ active, setActive, offerCount }) {
  const tabs = [
    { id: "home", icon: "⊞", label: "Home" },
    { id: "offers", icon: "📋", label: "Offers", badge: offerCount },
    { id: "jobs", icon: "🗓", label: "Jobs" },
    { id: "earnings", icon: "💰", label: "Earnings" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex safe-bottom z-50" style={{ maxWidth: "430px", margin: "0 auto" }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 relative transition-colors ${active === t.id ? "text-[#0B5FFF]" : "text-slate-400"}`}
        >
          <span className="text-lg leading-none relative">
            {t.icon}
            {t.badge > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold" style={{ fontSize: "9px" }}>
                {t.badge}
              </span>
            )}
          </span>
          <span className={`text-xs font-semibold ${active === t.id ? "text-[#0B5FFF]" : "text-slate-400"}`}>{t.label}</span>
          {active === t.id && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#0B5FFF] rounded-full" />}
        </button>
      ))}
    </nav>
  );
}

function TopBar({ title, onLogout }) {
  return (
    <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <img src={logo} alt="Spife Clean" className="h-6 w-6 rounded object-cover" />
        <span className="font-display font-semibold text-slate-800 text-sm tracking-tight">{title || "Spife Clean"}</span>
      </div>
      <button onClick={onLogout} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
        <span className="text-sm">↩</span>
      </button>
    </header>
  );
}

// ============================================================
// HOME
// ============================================================

function HomeDashboard({ tech, jobOffers, upcomingJobs, completedJobs, onNavTo }) {
  const totalEarnings = completedJobs.reduce((s, j) => s + (j.payout || 0), 0);
  const cards = [
    { label: "New Job Offers", value: jobOffers.length, icon: "📋", color: "from-[#0B5FFF] to-blue-700", action: "offers" },
    { label: "Upcoming Jobs", value: upcomingJobs.length, icon: "🗓", color: "from-violet-500 to-violet-600", action: "jobs" },
    { label: "Completed Jobs", value: completedJobs.length, icon: "✅", color: "from-emerald-500 to-emerald-600", action: "completed" },
    { label: "Total Earnings", value: `$${totalEarnings.toFixed(0)}`, icon: "💰", color: "from-amber-500 to-amber-600", action: "earnings" },
  ];

  return (
    <div className="p-4 pb-24 space-y-5">
      <div className="bg-gradient-to-r from-[#0B5FFF] to-[#0A2540] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Avatar name={`${tech.firstName || ""} ${tech.lastName || ""}`} size="lg" />
          <div>
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">Welcome back</p>
            <h1 className="text-xl font-bold">
              {tech.firstName} {tech.lastName}
            </h1>
          </div>
        </div>
        {jobOffers.length > 0 && (
          <div className="mt-4 bg-white/20 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-100">You have new offers!</p>
              <p className="font-bold text-sm">
                {jobOffers.length} job{jobOffers.length > 1 ? "s" : ""} waiting for your response
              </p>
            </div>
            <button onClick={() => onNavTo("offers")} className="bg-white text-[#0B5FFF] text-xs font-bold px-3 py-1.5 rounded-lg">
              View →
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <button key={c.label} onClick={() => onNavTo(c.action)} className={`bg-gradient-to-br ${c.color} rounded-2xl p-4 text-left text-white active:scale-95 transition-transform`}>
            <span className="text-2xl">{c.icon}</span>
            <p className="text-2xl font-bold mt-2">{c.value}</p>
            <p className="text-xs opacity-80 mt-0.5">{c.label}</p>
          </button>
        ))}
      </div>

      {upcomingJobs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-2">Next Job</h3>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-slate-800">{upcomingJobs[0].customerName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{upcomingJobs[0].serviceType}</p>
              </div>
              <Badge status={upcomingJobs[0].status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span>📅</span>
                {upcomingJobs[0].date}
              </div>
              <div className="flex items-center gap-1.5">
                <span>🕐</span>
                {upcomingJobs[0].time}
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <span>📍</span>
                <span className="truncate">{upcomingJobs[0].address}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
              <span className="font-bold text-emerald-600">${(upcomingJobs[0].payout || 0).toFixed(2)}</span>
              <button onClick={() => onNavTo("jobs")} className="text-[#0B5FFF] text-xs font-bold">
                Manage →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// JOB OFFERS
// ============================================================

function JobOffersPage({ jobOffers, onAccept, onDecline }) {
  const [expanded, setExpanded] = useState(null);
  const [actioned, setActioned] = useState({});

  if (jobOffers.length === 0)
    return (
      <div className="p-4 pb-24 flex flex-col items-center justify-center min-h-64 text-center">
        <span className="text-5xl mb-4">📭</span>
        <h3 className="font-bold text-slate-700 text-lg">No job offers right now</h3>
        <p className="text-slate-400 text-sm mt-1">New offers will appear here. Check back soon.</p>
      </div>
    );

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Job Offers</h2>
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{jobOffers.length} new</span>
      </div>
      {jobOffers.map((job) => (
        <div key={job.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${actioned[job.id] ? "opacity-40 scale-95" : "border-slate-100"}`}>
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-blue-50 text-[#0B5FFF] text-xs font-bold px-2 py-0.5 rounded-lg">{job.id.slice(0, 8)}</span>
                  <span className="bg-slate-50 text-slate-600 text-xs px-2 py-0.5 rounded-lg">{job.serviceType}</span>
                </div>
                <p className="font-bold text-slate-800 text-base">{job.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-600">${(job.payout || 0).toFixed(2)}</p>
                <p className="text-xs text-slate-400">{job.duration}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="text-base">📅</span>
                <span>
                  {job.date} at {job.time}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">📍</span>
                <span className="flex-1 text-xs">{job.address}</span>
              </div>
            </div>

            {expanded === job.id && (
              <div className="mt-3 pt-3 border-t border-slate-50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Job Details</p>
                <p className="text-sm text-slate-600">{job.description}</p>
              </div>
            )}

            <button onClick={() => setExpanded(expanded === job.id ? null : job.id)} className="text-[#0B5FFF] text-xs font-semibold mt-2 block">
              {expanded === job.id ? "Hide details ▲" : "View details ▼"}
            </button>
          </div>

          <div className="grid grid-cols-2 border-t border-slate-100">
            <button
              onClick={() => {
                setActioned((a) => ({ ...a, [job.id]: "declined" }));
                setTimeout(() => onDecline(job.id), 400);
              }}
              disabled={!!actioned[job.id]}
              className="py-3.5 text-sm font-bold text-red-500 border-r border-slate-100 active:bg-red-50 transition-colors"
            >
              ✕ Decline
            </button>
            <button
              onClick={() => {
                setActioned((a) => ({ ...a, [job.id]: "accepted" }));
                setTimeout(() => onAccept(job.id), 400);
              }}
              disabled={!!actioned[job.id]}
              className="py-3.5 text-sm font-bold text-[#0B5FFF] bg-blue-50/50 active:bg-blue-100 transition-colors"
            >
              ✓ Accept Job
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// UPCOMING JOBS
// ============================================================

function UpcomingJobsPage({ upcomingJobs, onUpdateStatus }) {
  const [activeJob, setActiveJob] = useState(null);

  if (upcomingJobs.length === 0)
    return (
      <div className="p-4 pb-24 flex flex-col items-center justify-center min-h-64 text-center">
        <span className="text-5xl mb-4">🗓</span>
        <h3 className="font-bold text-slate-700 text-lg">No upcoming jobs</h3>
        <p className="text-slate-400 text-sm mt-1">Accepted jobs will appear here.</p>
      </div>
    );

  if (activeJob) {
    const job = upcomingJobs.find((j) => j.id === activeJob) || upcomingJobs[0];
    const currentIdx = STATUS_FLOW.indexOf(job.status);
    const nextStatus = STATUS_FLOW[currentIdx + 1];

    return (
      <div className="p-4 pb-24">
        <button onClick={() => setActiveJob(null)} className="flex items-center gap-1.5 text-[#0B5FFF] text-sm font-semibold mb-4">
          ← Back to jobs
        </button>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#0B5FFF] to-[#0A2540] p-4 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-200 text-xs font-semibold">{job.id.slice(0, 8)}</p>
                <h3 className="font-bold text-lg mt-0.5">{job.customerName}</h3>
                <p className="text-blue-200 text-sm">{job.serviceType}</p>
              </div>
              <p className="text-xl font-bold">${(job.payout || 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="p-4 space-y-3 text-sm text-slate-600 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span>📅</span>
              {job.date} at {job.time}
            </div>
            <div className="flex items-start gap-2">
              <span>📍</span>
              <span className="flex-1">{job.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📞</span>
              {job.customerPhone}
            </div>
          </div>

          <div className="p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Job Progress</p>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-slate-100" />
              <div
                className="absolute top-3.5 left-0 h-0.5 bg-blue-500 transition-all duration-500"
                style={{ width: `${(currentIdx / (STATUS_FLOW.length - 1)) * 100}%` }}
              />
              {STATUS_FLOW.map((s, i) => (
                <div key={s} className="flex flex-col items-center gap-1 relative z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                    ${i < currentIdx ? "bg-blue-500 border-blue-500 text-white" : i === currentIdx ? "bg-white border-blue-500 text-[#0B5FFF]" : "bg-white border-slate-200 text-slate-300"}`}
                  >
                    {i < currentIdx ? "✓" : i + 1}
                  </div>
                  <span className="text-xs text-slate-500 text-center leading-tight" style={{ fontSize: "9px", maxWidth: "48px" }}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 pt-0 space-y-3">
            {nextStatus && nextStatus !== "Completed" && (
              <button onClick={() => onUpdateStatus(job.id, nextStatus)} className="w-full bg-[#0B5FFF] text-white font-bold py-3.5 rounded-xl text-sm active:scale-95 transition-transform">
                Mark as {nextStatus}
              </button>
            )}
            {nextStatus === "Completed" && (
              <button
                onClick={() => {
                  onUpdateStatus(job.id, "Completed");
                  setActiveJob(null);
                }}
                className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl text-sm active:scale-95 transition-transform"
              >
                ✓ Complete Job
              </button>
            )}
            <a href={`tel:${job.customerPhone}`} className="w-full border border-[#0B5FFF] text-[#0B5FFF] font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
              📞 Contact Customer
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-4">
      <h2 className="text-lg font-bold text-slate-800">Upcoming Jobs</h2>
      {upcomingJobs.map((job) => (
        <div key={job.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-slate-400 font-semibold mb-0.5">{job.id.slice(0, 8)}</p>
                <p className="font-bold text-slate-800">{job.customerName}</p>
                <p className="text-xs text-slate-500">{job.serviceType}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">${(job.payout || 0).toFixed(2)}</p>
                <Badge status={job.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <span>📅</span>
                {job.date}
              </div>
              <div className="flex items-center gap-1">
                <span>🕐</span>
                {job.time}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
              <span>📍</span>
              <span className="truncate">{job.address}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 border-t border-slate-100">
            <button onClick={() => setActiveJob(job.id)} className="py-3 text-sm font-bold text-[#0B5FFF] border-r border-slate-100 active:bg-blue-50">
              Manage Job →
            </button>
            <a href={`tel:${job.customerPhone}`} className="py-3 text-sm font-bold text-slate-600 text-center block active:bg-slate-50">
              📞 Contact
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// COMPLETED + EARNINGS
// ============================================================

function CompletedJobsPage({ completedJobs }) {
  const total = completedJobs.reduce((s, j) => s + (j.payout || 0), 0);
  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Completed Jobs</h2>
        <span className="text-sm font-bold text-emerald-600">${total.toFixed(2)} earned</span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        {completedJobs.length === 0 && <p className="p-4 text-sm text-slate-400">No completed jobs yet.</p>}
        {completedJobs.map((job, i) => (
          <div key={job.id} className={`p-3 grid grid-cols-4 gap-2 items-center text-sm ${i !== completedJobs.length - 1 ? "border-b border-slate-50" : ""}`}>
            <span className="text-[#0B5FFF] font-semibold text-xs">{job.id.slice(0, 8)}</span>
            <span className="text-slate-500 text-xs">{job.date}</span>
            <span className="text-slate-700 text-xs truncate">{(job.serviceType || "").split(" ")[0]}</span>
            <span className="text-emerald-600 font-bold text-xs text-right">${(job.payout || 0).toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EarningsPage({ completedJobs }) {
  const total = completedJobs.reduce((s, j) => s + (j.payout || 0), 0);
  return (
    <div className="p-4 pb-24 space-y-5">
      <h2 className="text-lg font-bold text-slate-800">Earnings</h2>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Earnings</p>
        <p className="text-2xl font-bold mt-1 text-emerald-600">${total.toFixed(0)}</p>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-2">Recent Transactions</h3>
        <div className="space-y-2">
          {completedJobs.slice(0, 6).map((job) => (
            <div key={job.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-semibold text-slate-700 text-sm">{job.serviceType}</p>
                <p className="text-xs text-slate-400">
                  {job.date} · {job.id.slice(0, 8)}
                </p>
              </div>
              <span className="font-bold text-emerald-600">+${(job.payout || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PROFILE
// ============================================================

function ProfilePage({ tech }) {
  return (
    <div className="pb-24">
      <div className="bg-gradient-to-r from-[#0B5FFF] to-[#0A2540] p-5 text-white">
        <div className="flex items-center gap-4">
          <Avatar name={`${tech.firstName || ""} ${tech.lastName || ""}`} size="lg" />
          <div>
            <h2 className="font-bold text-lg">
              {tech.firstName} {tech.lastName}
            </h2>
            <p className="text-blue-200 text-sm">{tech.phone}</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-700 mb-3">Contact Info</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Phone</span>
              <span className="font-semibold text-slate-700">{tech.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-700">{tech.email || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [tech, setTech] = useState({ id: "guest", firstName: "Guest", lastName: "Tech", phone: "", email: "" });
  const [checkingSession, setCheckingSession] = useState(true);
  const [page, setPage] = useState("home");
  const [jobs, setJobs] = useState([]);

  // Try to restore session on load
  useEffect(() => {
    const savedId = localStorage.getItem("spife_tech_id");
    if (!savedId) {
      setCheckingSession(false);
      return;
    }
    (async () => {
      const q = query(collection(db, "technicians"), where("__name__", "==", savedId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setTech({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        localStorage.removeItem("spife_tech_id");
      }
      setCheckingSession(false);
    })();
  }, []);

  // Live subscription to this tech's jobs
  useEffect(() => {
    if (!tech) return;
    const q = query(collection(db, "jobs"), where("technicianId", "==", tech.id));
    const unsub = onSnapshot(q, (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [tech]);

  const jobOffers = jobs.filter((j) => j.status === "Offered");
  const upcomingJobs = jobs.filter((j) => STATUS_FLOW.slice(0, -1).includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === "Completed");

  const handleAccept = async (jobId) => {
    await updateDoc(doc(db, "jobs", jobId), { status: "Accepted" });
  };

  const handleDecline = async (jobId) => {
    await updateDoc(doc(db, "jobs", jobId), { status: "Declined" });
  };

  const handleUpdateStatus = async (jobId, newStatus) => {
    await updateDoc(doc(db, "jobs", jobId), { status: newStatus });
  };

  const navTo = (dest) => setPage(dest === "completed" ? "completed" : dest);

  if (checkingSession) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
  }

  // TEMP: login gate disabled until new Firebase account is set up.
  // tech defaults to a placeholder identity above — job filtering by technicianId
  // won't reflect a real technician until PIN/phone login is restored.

  return (
    <div className="min-h-screen bg-slate-50 font-body" style={{ maxWidth: "430px", margin: "0 auto", position: "relative" }}>
      <style>{FONT_IMPORT}</style>
      <TopBar
        title={
          page === "home" ? "Spife Clean" : page === "offers" ? "Job Offers" : page === "jobs" ? "My Jobs" : page === "earnings" ? "Earnings" : page === "profile" ? "My Profile" : "Completed Jobs"
        }
        onLogout={() => {
          localStorage.removeItem("spife_tech_id");
          setTech(null);
        }}
      />

      <main className="overflow-y-auto" style={{ minHeight: "calc(100vh - 56px - 60px)" }}>
        {page === "home" && <HomeDashboard tech={tech} jobOffers={jobOffers} upcomingJobs={upcomingJobs} completedJobs={completedJobs} onNavTo={navTo} />}
        {page === "offers" && <JobOffersPage jobOffers={jobOffers} onAccept={handleAccept} onDecline={handleDecline} />}
        {page === "jobs" && <UpcomingJobsPage upcomingJobs={upcomingJobs} onUpdateStatus={handleUpdateStatus} />}
        {page === "completed" && <CompletedJobsPage completedJobs={completedJobs} />}
        {page === "earnings" && <EarningsPage completedJobs={completedJobs} />}
        {page === "profile" && <ProfilePage tech={tech} />}
      </main>

      <BottomNav active={["home", "offers", "jobs", "earnings", "profile"].includes(page) ? page : "jobs"} setActive={setPage} offerCount={jobOffers.length} />
    </div>
  );
}
