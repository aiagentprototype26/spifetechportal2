// Central service catalog. Add/remove categories or items here and every
// form (tech self-signup, dispatcher add-tech, job dispatch) stays in sync.

export const SERVICE_CATEGORIES = [
  {
    category: "Carpet & Rug Services",
    items: [
      "Steam cleaning", "Deep cleaning", "Pre treatment", "Shampoo", "Deodorizing",
      "Sanitizing", "Enzyme treatment", "Odor removal", "Stain removal", "Scotch guarding",
      "Fringe repair", "Rug pickup & Delivery", "Rug storage", "Padding replacement",
      "Stretching", "Repair", "Carpet dyeing", "Drying/dehumidify", "Installation",
      "Synthetic rug", "Wool rug", "Silk/special rugs", "Fringe cleaning",
    ],
  },
  {
    category: "Upholstery",
    items: ["Leather", "Suede", "Velvet", "Mattress cleaning"],
  },
  {
    category: "Vehicles",
    items: ["Vehicle cleaning"],
  },
  {
    category: "Tile & Grout",
    items: ["Tile cleaning", "Grout resealing/refinishing", "Tile installation/reinstallation"],
  },
  {
    category: "Hardwood Floor",
    items: ["Cleaning", "Refinishing/Waxing", "Sanding + buffing", "Repair", "Reinstallation", "Fresh installation"],
  },
  {
    category: "Air Duct",
    items: [
      "Air system cleaning", "Coil cleaning", "Laundry/dryer exhaust systems", "Sanitizing/disinfecting",
      "Video duct inspection", "Antifungal sealants", "Mechanical hygiene (surveys)",
      "Air handler refurbishment", "Fiberglass remediation", "Insulation refurbishment", "Cooling tower cleaning",
    ],
  },
  {
    category: "Water & Fire Damage",
    items: [
      "Water extraction", "Water damage treatment", "Mold treatment", "Drying/dehumidify",
      "Water damage restoration", "Fire & smoke damage restoration",
    ],
  },
];

// Unique key per service, since a few names (e.g. "Repair") repeat across categories.
export const serviceKey = (category, item) => `${category} > ${item}`;

export const ALL_SERVICE_KEYS = SERVICE_CATEGORIES.flatMap((c) => c.items.map((i) => serviceKey(c.category, i)));
