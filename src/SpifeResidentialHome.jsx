import React, { useState, useEffect, useRef } from "react";
import {
  Home, Building2, Sparkles, ArrowRight, Star, Check, ChevronDown,
  MapPin, Clock, ShieldCheck, Truck, Wind, Refrigerator, Flame,
  WashingMachine, Boxes, PawPrint, Menu, X, Phone
} from "lucide-react";

/**
 * Spife Clean — Residential Division
 * Customer-facing homepage (Phase 1)
 * Design tokens:
 *  - Primary Blue:  #0B5FFF
 *  - Deep Navy:     #0A2540
 *  - Emerald:       #10B981
 *  - Neutral BG:    #F7F9FC
 *  - Ink:           #111827
 *  - Muted:         #6B7280
 *  - Display: Space Grotesk | Body: Inter | Utility/Mono: IBM Plex Mono
 */

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
.font-display { font-family: 'Space Grotesk', sans-serif; }
.font-body { font-family: 'Inter', sans-serif; }
.font-mono { font-family: 'IBM Plex Mono', monospace; }
`;

const STATUSES = [
  "Requested",
  "Offered",
  "Accepted",
  "En Route",
  "Arrived",
  "In Progress",
  "Completed",
];

function StatusRail({ compact = false }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % STATUSES.length);
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`w-full ${compact ? "" : "py-2"}`}>
      <div className="flex items-center w-full">
        {STATUSES.map((s, i) => {
          const isDone = i < active;
          const isActive = i === active;
          return (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`flex items-center justify-center rounded-full transition-all duration-500 border-2
                    ${compact ? "w-6 h-6" : "w-9 h-9"}
                    ${isDone ? "bg-emerald-500 border-emerald-500" : ""}
                    ${isActive ? "bg-[#0B5FFF] border-[#0B5FFF] scale-110 shadow-[0_0_0_6px_rgba(11,95,255,0.15)]" : ""}
                    ${!isDone && !isActive ? "bg-white border-slate-200" : ""}
                  `}
                >
                  {isDone && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  {isActive && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                </div>
                {!compact && (
                  <span
                    className={`font-mono text-[10px] sm:text-xs mt-2 tracking-tight text-center transition-colors duration-500 truncate w-full
                      ${isActive ? "text-[#0B5FFF] font-semibold" : isDone ? "text-emerald-600" : "text-slate-400"}
                    `}
                  >
                    {s}
                  </span>
                )}
              </div>
              {i < STATUSES.length - 1 && (
                <div
                  className={`h-[2px] flex-1 -mt-5 sm:-mt-6 transition-colors duration-500 ${
                    i < active ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

const SERVICES = [
  {
    icon: Home,
    name: "Standard Cleaning",
    desc: "Routine upkeep for a home that's already in good shape.",
    time: "1.5–3 hrs",
    price: 89,
    included: ["Kitchen wipe-down", "Bathrooms scrubbed", "Dusting & vacuuming", "Floors mopped"],
  },
  {
    icon: Sparkles,
    name: "Deep Cleaning",
    desc: "A top-to-bottom reset — baseboards, fixtures, the works.",
    time: "3–5 hrs",
    price: 169,
    included: ["Everything in Standard", "Baseboards & trim", "Interior windows", "Behind furniture"],
  },
  {
    icon: Truck,
    name: "Move In / Move Out",
    desc: "Empty-home cleaning before keys change hands.",
    time: "3–6 hrs",
    price: 199,
    included: ["Inside cabinets", "Inside appliances", "Wall spot-cleaning", "Closets & shelving"],
  },
  {
    icon: Building2,
    name: "Airbnb Turnover",
    desc: "Fast, consistent resets between guest stays.",
    time: "1–2 hrs",
    price: 79,
    included: ["Linen reset", "Restock staging", "Photo-ready check", "Trash & recycling"],
  },
];

const ADDONS = [
  { icon: WashingMachine, name: "Laundry" },
  { icon: Refrigerator, name: "Inside Fridge" },
  { icon: Flame, name: "Inside Oven" },
  { icon: Wind, name: "Interior Windows" },
  { icon: Boxes, name: "Organization" },
  { icon: PawPrint, name: "Pet Hair" },
];

const REVIEWS = [
  { name: "Danielle R.", area: "Bed-Stuy, Brooklyn", text: "The rail-tracking thing is oddly satisfying — I knew exactly when my cleaner was 10 minutes out.", stars: 5 },
  { name: "Marcus T.", area: "Astoria, Queens", text: "Booked a move-out clean same week. Landlord didn't have a single note on the walkthrough.", stars: 5 },
  { name: "Priya K.", area: "Harlem, Manhattan", text: "Switched our Airbnb turnovers over from a solo cleaner. Way more consistent between units.", stars: 4 },
];

const FAQS = [
  { q: "How is pricing calculated?", a: "Price is based on bedrooms, bathrooms, square footage, service type, add-ons, and frequency. You'll see the full breakdown before you confirm — no surprise line items after the job." },
  { q: "Do I need to be home?", a: "No. Most customers share a gate code or lockbox in the booking notes. Your tech's arrival and every status change is tracked live in your dashboard either way." },
  { q: "What if I need to reschedule?", a: "You can reschedule or cancel directly from your dashboard up to 24 hours before your appointment with no fee." },
  { q: "Are cleaners background-checked?", a: "Yes. Every technician completes an identity and background check before being approved to accept jobs on the platform." },
];

function Section({ children, className = "" }) {
  return <section className={`px-6 sm:px-10 lg:px-20 ${className}`}>{children}</section>;
}

export default function SpifeResidentialHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

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
              RESIDENTIAL
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#services" className="hover:text-[#0B5FFF] transition-colors">Services</a>
            <a href="#how" className="hover:text-[#0B5FFF] transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-[#0B5FFF] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#0B5FFF] transition-colors">FAQs</a>
            <button className="text-slate-500 hover:text-[#0B5FFF] transition-colors flex items-center gap-1">
              <Building2 className="w-4 h-4" /> Commercial
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button className="text-sm font-medium text-[#0B5FFF] px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
              Get Quote
            </button>
            <button className="text-sm font-semibold text-white bg-[#0B5FFF] px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
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
              <a href="#faq">FAQs</a>
              <button className="text-left text-white bg-[#0B5FFF] px-4 py-2.5 rounded-lg font-semibold">
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
              Professional house cleaning<br className="hidden sm:block" /> you can{" "}
              <span className="text-[#0B5FFF]">actually track.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-md">
              Book trusted cleaners in minutes — and watch every step, from
              "Requested" to "Completed," in real time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="flex items-center gap-2 text-sm font-semibold text-white bg-[#0B5FFF] px-6 py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                Book Now <ArrowRight className="w-4 h-4" />
              </button>
              <button className="text-sm font-semibold text-[#0A2540] bg-white border border-slate-200 px-6 py-3.5 rounded-xl hover:border-slate-300 transition-colors">
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

          {/* Signature: live job status rail card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-mono text-slate-400">JOB #SP-10492</p>
                <p className="font-display font-semibold text-[#0A2540]">Deep Cleaning · 2BR/1BA</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
              </div>
            </div>

            <StatusRail />

            <div className="mt-8 flex items-center gap-3 pt-6 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500">
                MT
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0A2540]">Maria T. is your cleaner</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> 8 min away
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-[#0B5FFF]">$169</span>
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
              className="group border border-slate-100 rounded-2xl p-6 hover:border-[#0B5FFF]/30 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 flex flex-col"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-[#0B5FFF] transition-colors duration-300">
                <s.icon className="w-5 h-5 text-[#0B5FFF] group-hover:text-white transition-colors duration-300" />
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
                <button className="text-xs font-semibold text-[#0B5FFF] flex items-center gap-1 group-hover:gap-2 transition-all">
                  Book <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add-ons strip */}
        <div className="mt-10 flex flex-wrap gap-3">
          {ADDONS.map((a) => (
            <div
              key={a.name}
              className="flex items-center gap-2 text-sm text-slate-600 bg-[#F7F9FC] border border-slate-100 px-4 py-2.5 rounded-full"
            >
              <a.icon className="w-4 h-4 text-[#0B5FFF]" /> {a.name}
            </div>
          ))}
        </div>
      </Section>

      {/* HOW IT WORKS — tied to real job pipeline */}
      <Section id="how" className="py-16">
        <div className="bg-[#0A2540] rounded-3xl px-6 sm:px-12 py-14 text-white overflow-hidden relative">
          <div className="max-w-2xl">
            <p className="text-xs font-mono text-emerald-400 mb-3 tracking-wide">HOW IT WORKS</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold">
              Every job moves through the same seven stages.
            </h2>
            <p className="text-slate-300 mt-4 max-w-lg">
              No guessing whether your cleaner is coming. Your job status updates
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
              <p className="text-slate-300"><span className="text-white font-medium">Get matched</span> — a vetted tech near you accepts the job.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 font-mono text-xs">3</div>
              <p className="text-slate-300"><span className="text-white font-medium">Track live</span> — from en route to before/after photos on completion.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* PRICING TEASER */}
      <Section id="pricing" className="py-16 bg-white">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-mono text-[#0B5FFF] mb-3 tracking-wide">PRICING</p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#0A2540] mb-4">
              One estimate, no surprises.
            </h2>
            <p className="text-slate-600 max-w-md mb-6">
              Price is calculated from your home size, service type, add-ons,
              and how often you book — shown up front, before you confirm.
            </p>
            <ul className="space-y-3">
              {["Bedrooms & bathrooms", "Square footage", "Service type & add-ons", "Weekly / biweekly / monthly discounts"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#F7F9FC] border border-slate-100 rounded-2xl p-8">
            <p className="text-xs font-mono text-slate-400 mb-1">ESTIMATE PREVIEW</p>
            <div className="space-y-3 mt-4 text-sm">
              {[
                ["Deep Cleaning · 2BR/1BA", "$169"],
                ["Inside Oven add-on", "$25"],
                ["Interior Windows add-on", "$30"],
                ["Biweekly discount", "–$18"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-slate-600">
                  <span>{label}</span>
                  <span className="font-mono">{val}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-[#0A2540] pt-3 border-t border-slate-200">
                <span>Total</span>
                <span className="font-mono">$206</span>
              </div>
            </div>
            <button className="w-full mt-6 text-sm font-semibold text-white bg-[#0B5FFF] py-3 rounded-xl hover:bg-blue-700 transition-colors">
              Start Booking
            </button>
          </div>
        </div>
      </Section>

      {/* REVIEWS */}
      <Section className="py-16">
        <p className="text-xs font-mono text-[#0B5FFF] mb-3 tracking-wide">REVIEWS</p>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#0A2540] mb-10">
          NYC customers on the rail.
        </h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {REVIEWS.map((r) => (
            <div key={r.name} className="bg-white border border-slate-100 rounded-2xl p-6">
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
      <Section id="faq" className="py-16 bg-white">
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
      <Section className="py-16">
        <div className="bg-[#0B5FFF] rounded-3xl px-8 py-14 text-center text-white">
          <h2 className="font-display text-3xl sm:text-4xl font-semibold mb-4">
            Book your first cleaning today.
          </h2>
          <p className="text-blue-100 mb-8 max-w-md mx-auto">
            Live tracking, background-checked techs, no surprise pricing.
          </p>
          <button className="bg-white text-[#0B5FFF] font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
            Book Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-slate-100 py-10">
        <Section className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#0B5FFF] flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-medium text-[#0A2540]">Spife Clean</span>
            <span className="text-slate-300">— Residential</span>
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
