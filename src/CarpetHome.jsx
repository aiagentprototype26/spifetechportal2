import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles, ArrowRight, Star, Check, ChevronDown, MapPin, Clock, ShieldCheck,
  Droplets, PawPrint, Wind as WindIcon, Menu, X, Phone, Crown, Truck,
  Sofa, Car, Grid3x3, TreePine, Flame,
} from "lucide-react";
import { SERVICE_CATEGORIES } from "./services";

/**
 * Spife Clean — Carpet & Rug Division
 * Customer-facing homepage, same layout/interaction system as the
 * residential cleaning homepage, retargeted at the carpet & rug business.
 * Pulls the real service catalog from services.js so it stays in sync
 * with the tech-facing forms.
 *
 * Design tokens (unchanged from residential):
 *  - Primary Blue:  #0B5FFF
 *  - Deep Navy:     #0A2540
 *  - Emerald:       #10B981
 *  - Amber (premium accent): #F59E0B
 *  - Neutral BG:    #F7F9FC
 *  - Ink:           #111827
 *  - Muted:         #6B7280
 */

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
.font-display { font-family: 'Space Grotesk', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
.font-mono { font-family: 'IBM Plex Mono', monospace; }

@keyframes softPulseGreen {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); opacity: 1; }
  50% { box-shadow: 0 0 0 8px rgba(16,185,129,0); opacity: 0.85; }
}
.pulse-live-green { animation: softPulseGreen 1.8s ease-in-out infinite; }
.stage-connector { transition: background-color 600ms ease, transform 600ms ease; }
.addon-toggle {
  transition: background-color 180ms ease, color 180ms ease, border-color 180ms ease, transform 120ms ease;
}
.addon-toggle:active { transform: scale(0.97); }
`;

const STATUSES = ["Requested", "Offered", "Accepted", "En Route", "Arrived", "In Progress", "Completed"];

function StatusRail({ compact = false, pinnedIndex = null }) {
  const [cycled, setCycled] = useState(0);
  const active = pinnedIndex !== null ? pinnedIndex : cycled;

  useEffect(() => {
    if (pinnedIndex !== null) return;
    const id = setInterval(() => setCycled((a) => (a + 1) % STATUSES.length), 1400);
    return () => clearInterval(id);
  }, [pinnedIndex]);

  return (
    <div className={`w-full ${compact ? "" : "py-2"}`}>
      <div className="flex items-center w-full">
        {STATUSES.map((s, i) => {
          const isDone = i < active;
          const isActive = i === active;
          const isEnRoute = isActive && s === "En Route";
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`flex items-center justify-center rounded-full border-2 transition-all duration-500
                    ${compact ? "w-6 h-6" : "w-9 h-9"}
                    ${isDone ? "bg-emerald-500 border-emerald-500" : ""}
                    ${isActive && !isEnRoute ? "bg-[#0B5FFF] border-[#0B5FFF] scale-110 shadow-[0_0_0_6px_rgba(11,95,255,0.15)]" : ""}
                    ${isEnRoute ? "bg-emerald-500 border-emerald-500 scale-110 pulse-live-green" : ""}
                    ${!isDone && !isActive ? "bg-white border-slate-200" : ""}
                  `}
                >
                  {isDone && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  {isActive && !isDone && (
                    <span className={`w-2 h-2 rounded-full bg-white ${isEnRoute ? "" : "animate-pulse"}`} />
                  )}
                </div>
                {!compact && (
                  <span
                    className={`font-mono text-[10px] sm:text-xs mt-2 tracking-tight text-center transition-colors duration-500 truncate w-full
                      ${isEnRoute ? "text-emerald-600 font-semibold" : isActive ? "text-[#0B5FFF] font-semibold" : isDone ? "text-emerald-600" : "text-slate-400"}
                    `}
                  >
                    {s}
                  </span>
                )}
              </div>
              {i < STATUSES.length - 1 && (
                <div className={`stage-connector h-[2px] flex-1 -mt-5 sm:-mt-6 ${i < active ? "bg-emerald-500" : "bg-slate-200"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ---- Carpet & Rug catalog, sourced live from services.js ----
const CARPET_CATEGORY = SERVICE_CATEGORIES.find((c) => c.category === "Carpet & Rug Services");

// Packaged offerings built from real catalog items. Prices are starting
// estimates — adjust to your actual rate card, they're not pulled from
// services.js since that file only tracks service names, not pricing.
const SERVICES = [
  {
    icon: Droplets,
    name: "Standard Steam Cleaning",
    desc: "Hot water extraction for everyday carpet upkeep, up to 2 rooms.",
    time: "45–90 min",
    price: 99,
    included: ["Pre-treatment", "Steam cleaning", "Deodorizing", "Fast-dry pass"],
  },
  {
    icon: Sparkles,
    name: "Deep Cleaning & Sanitizing",
    desc: "A full reset for carpets that haven't been touched in a while.",
    time: "1.5–3 hrs",
    price: 179,
    included: ["Everything in Standard", "Sanitizing", "Enzyme treatment", "Scotch guarding"],
  },
  {
    icon: PawPrint,
    name: "Pet Stain & Odor Treatment",
    desc: "Targeted enzyme treatment for pet stains and stubborn odors.",
    time: "1–2 hrs",
    price: 149,
    included: ["Stain removal", "Odor removal", "Enzyme treatment", "Deodorizing"],
  },
  {
    icon: Truck,
    name: "Rug Pickup, Clean & Delivery",
    desc: "White-glove care for area rugs — picked up, cleaned off-site, returned.",
    time: "3–5 day turnaround",
    price: 129,
    included: ["Rug pickup & delivery", "Fringe cleaning", "Padding replacement (opt.)", "Rug storage available"],
    premium: true,
  },
];

// Remaining Carpet & Rug items become interactive add-ons for the estimate
const ADDON_PRICE_MAP = {
  "Pre treatment": 15,
  "Shampoo": 20,
  "Scotch guarding": 25,
  "Sanitizing": 20,
  "Fringe repair": 40,
  "Stretching": 30,
  "Padding replacement": 35,
};

const ADDONS = Object.entries(ADDON_PRICE_MAP).map(([name, price]) => ({
  id: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  price,
}));

const BASE_SERVICE = { label: "Deep Cleaning & Sanitizing · 2 rooms", price: 179 };
const FIRST_TIME_DISCOUNT = 20;

// Other Spife divisions, pulled straight from services.js so this section
// never drifts from what's actually offered.
const OTHER_DIVISIONS = [
  { category: "Upholstery", icon: Sofa },
  { category: "Vehicles", icon: Car },
  { category: "Tile & Grout", icon: Grid3x3 },
  { category: "Hardwood Floor", icon: TreePine },
  { category: "Air Duct", icon: WindIcon },
  { category: "Water & Fire Damage", icon: Flame },
]
  .map((d) => {
    const match = SERVICE_CATEGORIES.find((c) => c.category === d.category);
    return match ? { ...d, sample: match.items.slice(0, 3) } : null;
  })
  .filter(Boolean);

const REVIEWS = [
  { name: "Danielle R.", area: "Bed-Stuy, Brooklyn", text: "Watching the tech's status change to En Route in real time beat the usual guessing game with cleaning services.", stars: 5 },
  { name: "Marcus T.", area: "Astoria, Queens", text: "Sent our 9x12 wool rug out for pickup-and-clean. Came back looking new, no hauling required.", stars: 5 },
  { name: "Priya K.", area: "Harlem, Manhattan", text: "Pet stain treatment finally got rid of a smell three other companies couldn't touch.", stars: 4 },
];

const FAQS = [
  { q: "How long does carpet take to dry?", a: "Most steam-cleaned carpets are dry to the touch within 4–8 hours with fans or good airflow. Our fast-dry pass on Standard and Deep Cleaning packages helps shorten that window further." },
  { q: "Do you clean area rugs on-site or off-site?", a: "Wall-to-wall carpet is cleaned on-site. Area and specialty rugs (wool, silk, synthetic) are typically picked up, cleaned off-site where we can fully submerge and rinse them, then delivered back." },
  { q: "Can you get pet odor completely out?", a: "In most cases, yes — our enzyme treatment breaks down the source of the odor rather than masking it. Severe or long-standing padding saturation may need a padding replacement for a full fix, which we'll flag before starting." },
  { q: "Are technicians background-checked?", a: "Yes. Every technician completes an identity and background check before being approved to accept jobs on the platform." },
];

function Section({ children, className = "" }) {
  return <section className={`px-6 sm:px-10 lg:px-20 ${className}`}>{children}</section>;
}

export default function CarpetHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const [selectedAddons, setSelectedAddons] = useState(() => new Set(["scotch-guarding", "sanitizing"]));

  const toggleAddon = (id) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const activeAddons = useMemo(() => ADDONS.filter((a) => selectedAddons.has(a.id)), [selectedAddons]);
  const addonsTotal = useMemo(() => activeAddons.reduce((sum, a) => sum + a.price, 0), [activeAddons]);
  const estimateTotal = BASE_SERVICE.price + addonsTotal - FIRST_TIME_DISCOUNT;

  const goToBooking = () => { window.location.href = "/book"; };

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-body text-[#111827]">
      <style>{FONT_IMPORT}</style>

      {/* NAV */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100">
        <Section className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0B5FFF] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-semibold text-lg">Spife Clean</span>
            <span className="hidden sm:inline-flex ml-2 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              CARPET &amp; RUG
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#services" className="hover:text-[#0B5FFF] transition-colors">Services</a>
            <a href="#how" className="hover:text-[#0B5FFF] transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-[#0B5FFF] transition-colors">Pricing</a>
            <a href="#more" className="hover:text-[#0B5FFF] transition-colors">Other services</a>
            <a href="#faq" className="hover:text-[#0B5FFF] transition-colors">FAQs</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={goToBooking} className="text-sm font-medium text-[#0B5FFF] px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              Get Quote
            </button>
            <button onClick={goToBooking} className="text-sm font-semibold text-white bg-[#0B5FFF] px-5 py-2.5 rounded-lg hover:bg-blue-700 hover:shadow-md hover:shadow-blue-200 active:scale-[0.98] transition-all">
              Book Now
            </button>
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </Section>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white">
            <div className="flex flex-col px-6 py-4 gap-4 text-sm font-medium text-slate-700">
              <a href="#services">Services</a>
              <a href="#how">How it works</a>
              <a href="#pricing">Pricing</a>
              <a href="#more">Other services</a>
              <a href="#faq">FAQs</a>
              <button onClick={goToBooking} className="text-left text-white bg-[#0B5FFF] px-4 py-2.5 rounded-lg font-semibold active:scale-[0.98] transition-transform">
                Book Now
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <Section className="pt-14 pb-16 lg:pt-20 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Background-checked techs · Live job tracking
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold leading-[1.1] tracking-tight text-[#0A2540]">
              Carpet &amp; rug cleaning<br className="hidden sm:block" /> you can{" "}
              <span className="text-[#0B5FFF]">actually track.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-md">
              Steam cleaning, pet stain treatment, and white-glove rug pickup —
              booked in minutes, tracked in real time from "Requested" to "Completed."
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={goToBooking} className="flex items-center gap-2 text-sm font-semibold text-white bg-[#0B5FFF] px-6 py-3.5 rounded-xl hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 active:scale-[0.98] transition-all shadow-lg shadow-blue-200">
                Book Now <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={goToBooking} className="text-sm font-semibold text-[#0A2540] bg-white border border-slate-200 px-6 py-3.5 rounded-xl hover:border-slate-300 transition-colors">
                Get a Quote
              </button>
            </div>

            <div className="flex items-center gap-6 mt-9 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <span className="font-medium text-slate-700 ml-1">4.9</span>
                <span>(2,400+ NYC cleanings)</span>
              </div>
            </div>
          </div>

          {/* Live job status rail card — pinned to "En Route" to showcase the green pulse */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-mono text-slate-400">JOB #SP-20871</p>
                <p className="font-display font-semibold text-[#0A2540]">Deep Cleaning &amp; Sanitizing · 2 rooms</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-live-green" /> LIVE
              </div>
            </div>

            <StatusRail pinnedIndex={3} />

            <div className="mt-8 flex items-center gap-3 pt-6 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500">
                MT
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0A2540]">Maria T. is your technician</p>
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> En route · 8 min away
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-[#0B5FFF]">$179</span>
            </div>
          </div>
        </div>
      </Section>

      {/* SERVICES */}
      <Section id="services" className="py-16 bg-white">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono text-[#0B5FFF] mb-3 tracking-wide">SERVICES</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#0A2540]">
            Pick a service, add what you need.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICES.map((s) => (
            <div
              key={s.name}
              className={`group relative border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 flex flex-col
                ${s.premium
                  ? "border-amber-300/70 hover:border-amber-400 hover:shadow-amber-100/60 bg-gradient-to-b from-amber-50/40 to-white"
                  : "border-slate-100 hover:border-[#0B5FFF]/30 hover:shadow-blue-100/50"}
              `}
            >
              {s.premium && (
                <div className="absolute -top-3 right-4 flex items-center gap-1 text-[10px] font-mono font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full shadow-sm">
                  <Crown className="w-3 h-3" /> WHITE GLOVE
                </div>
              )}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300
                ${s.premium ? "bg-amber-100 group-hover:bg-amber-500" : "bg-blue-50 group-hover:bg-[#0B5FFF]"}
              `}>
                <s.icon className={`w-5 h-5 transition-colors duration-300 group-hover:text-white ${s.premium ? "text-amber-600" : "text-[#0B5FFF]"}`} />
              </div>
              <h3 className="font-display font-semibold text-[#0A2540]">{s.name}</h3>
              <p className="text-sm text-slate-500 mt-2 flex-1">{s.desc}</p>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-4">
                <Clock className="w-3.5 h-3.5" /> {s.time}
              </div>

              <ul className="mt-4 space-y-1.5">
                {s.included.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-500">
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block">Starting at</span>
                  <span className="font-mono font-semibold text-[#0A2540]">${s.price}</span>
                </div>
                <button onClick={goToBooking} className={`text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all ${s.premium ? "text-amber-600" : "text-[#0B5FFF]"}`}>
                  Book <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add-ons — interactive toggles pulled from the Carpet & Rug catalog, driving the live estimate below */}
        <div className="mt-10">
          <p className="text-xs font-mono text-slate-400 mb-3">TAP TO ADD TO YOUR ESTIMATE</p>
          <div className="flex flex-wrap gap-3">
            {ADDONS.map((a) => {
              const isActive = selectedAddons.has(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAddon(a.id)}
                  aria-pressed={isActive}
                  className={`addon-toggle flex items-center gap-2 text-sm px-4 py-2.5 rounded-full border
                    ${isActive
                      ? "bg-[#0B5FFF] border-[#0B5FFF] text-white scale-105 shadow-md shadow-blue-200"
                      : "bg-[#F7F9FC] border-slate-100 text-slate-600 hover:border-slate-300"}
                  `}
                >
                  <Droplets className={`w-4 h-4 ${isActive ? "text-white" : "text-[#0B5FFF]"}`} />
                  {a.name}
                  <span className={`font-mono text-xs ${isActive ? "text-blue-100" : "text-slate-400"}`}>
                    +${a.price}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="how" className="py-16">
        <div className="bg-[#0A2540] rounded-3xl px-6 sm:px-12 py-14 text-white overflow-hidden relative">
          <div className="max-w-2xl">
            <p className="text-xs font-mono text-emerald-400 mb-3 tracking-wide">HOW IT WORKS</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold">
              Every job moves through the same seven stages.
            </h2>
            <p className="text-slate-300 mt-4 max-w-lg">
              No guessing whether your technician is coming. Your job status updates
              live, the same pipeline our dispatchers use behind the scenes.
            </p>
          </div>

          <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur">
            <StatusRail />
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mt-10 text-sm">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-mono text-xs">1</div>
              <p className="text-slate-300"><span className="text-white font-medium">Book online</span> — pick a service, date, and add-ons in under 2 minutes.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-mono text-xs">2</div>
              <p className="text-slate-300"><span className="text-white font-medium">Get matched</span> — a vetted technician near you accepts the job.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-mono text-xs">3</div>
              <p className="text-slate-300"><span className="text-white font-medium">Track live</span> — from en route to before/after photos on completion.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* PRICING TEASER — reactive to selected add-ons */}
      <Section id="pricing" className="py-16 bg-white">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-mono text-[#0B5FFF] mb-3 tracking-wide">PRICING</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#0A2540] mb-4">
              One estimate, no surprises.
            </h2>
            <p className="text-slate-600 max-w-md mb-6">
              Price is calculated from room count, carpet/rug type, service tier,
              and add-ons — shown up front, before you confirm.
            </p>
            <ul className="space-y-3">
              {["Number of rooms / rug size", "Carpet, wool, or specialty rug", "Service tier & add-ons", "First-time customer discount"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#F7F9FC] border border-slate-100 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-mono text-slate-400">ESTIMATE PREVIEW</p>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                UPDATES LIVE
              </span>
            </div>
            <div className="space-y-3 mt-4 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{BASE_SERVICE.label}</span>
                <span className="font-mono">${BASE_SERVICE.price}</span>
              </div>

              {activeAddons.map((a) => (
                <div key={a.id} className="flex justify-between text-slate-600 transition-opacity duration-300">
                  <span>{a.name} add-on</span>
                  <span className="font-mono">+${a.price}</span>
                </div>
              ))}

              {activeAddons.length === 0 && (
                <p className="text-xs text-slate-400 italic">No add-ons selected yet — tap any add-on above.</p>
              )}

              <div className="flex justify-between text-emerald-600">
                <span>First-time customer discount</span>
                <span className="font-mono">–${FIRST_TIME_DISCOUNT}</span>
              </div>

              <div className="flex justify-between font-semibold text-[#0A2540] pt-3 border-t border-slate-200">
                <span>Total</span>
                <span className="font-mono">${estimateTotal}</span>
              </div>
            </div>
            <button onClick={goToBooking} className="w-full mt-6 text-sm font-semibold text-white bg-[#0B5FFF] py-3 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] transition-all">
              Start Booking
            </button>
          </div>
        </div>
      </Section>

      {/* OTHER SERVICES — pulled live from services.js so it never drifts from what's actually offered */}
      <Section id="more" className="py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-mono text-[#0B5FFF] mb-3 tracking-wide">ALSO FROM SPIFE</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#0A2540]">
            One platform, the whole restoration job.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {OTHER_DIVISIONS.map((d) => (
            <div key={d.category} className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-[#0B5FFF]/30 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300">
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                <d.icon className="w-5 h-5 text-[#0B5FFF]" />
              </div>
              <h3 className="font-display font-semibold text-[#0A2540] mb-2">{d.category}</h3>
              <p className="text-sm text-slate-500 mb-4">{d.sample.join(" · ")}</p>
              <button onClick={goToBooking} className="text-xs font-semibold text-[#0B5FFF] flex items-center gap-1">
                Get a quote <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* REVIEWS */}
      <Section className="py-16 bg-white">
        <p className="text-xs font-mono text-[#0B5FFF] mb-3 tracking-wide">REVIEWS</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#0A2540] mb-10">
          NYC customers on the rail.
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {REVIEWS.map((r) => (
            <div key={r.name} className="bg-[#F7F9FC] border border-slate-100 rounded-2xl p-6">
              <div className="flex text-amber-400 mb-3">
                {[...Array(r.stars)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">"{r.text}"</p>
              <p className="text-xs text-slate-400 mt-4 font-medium">{r.name} · {r.area}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq" className="py-16">
        <p className="text-xs font-mono text-[#0B5FFF] mb-3 tracking-wide">FAQS</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#0A2540] mb-10">
          Good to know.
        </h2>
        <div className="max-w-2xl divide-y divide-slate-100 border-t border-b border-slate-100">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button
                className="w-full flex items-center justify-between py-5 text-left"
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
              >
                <span className="font-medium text-[#0A2540]">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 pb-5" : "max-h-0"}`}>
                <p className="text-sm text-slate-500">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="py-16 bg-white">
        <div className="bg-[#0B5FFF] rounded-3xl px-8 py-14 text-center text-white">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">
            Book your first carpet cleaning today.
          </h2>
          <p className="text-blue-100 mb-8 max-w-md mx-auto">
            Live tracking, background-checked techs, no surprise pricing.
          </p>
          <button onClick={goToBooking} className="bg-white text-[#0B5FFF] font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 hover:shadow-lg active:scale-[0.98] transition-all inline-flex items-center gap-2">
            Book Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-10 bg-white">
        <Section className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#0B5FFF] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-medium text-[#0A2540]">Spife Clean</span>
            <span className="text-slate-300">— Carpet &amp; Rug</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#services" className="hover:text-[#0B5FFF]">Services</a>
            <a href="#faq" className="hover:text-[#0B5FFF]">FAQs</a>
            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> (718) 555-0142</span>
          </div>
        </Section>
      </footer>
    </div>
  );
}
