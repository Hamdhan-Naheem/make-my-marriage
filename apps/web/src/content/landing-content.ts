export const navigationItems = [
  { href: "#features", label: "Features" },
  { href: "#planning", label: "Planning together" },
  { href: "#organize", label: "Organize" },
  { href: "#guests", label: "Guests & RSVP" },
] as const;

export const workspace = {
  couple: "Ahamed & Fathima",
  dateLabel: "17 January 2027",
  location: "Colombo & Kandy celebrations",
  totalBudget: "LKR 5.0M",
  committed: "LKR 3.25M",
  paid: "LKR 1.22M",
  remaining: "LKR 1.75M",
  invited: 350,
  confirmed: 240,
  pending: 62,
  declined: 48,
  taskTotal: 52,
  taskComplete: 38,
  taskInProgress: 7,
  taskPending: 7,
} as const;

export const featureCards = [
  ["Multi-event planning", "Create custom celebrations, dates, locations, budgets, and side assignments."],
  ["Tasks and responsibilities", "Keep the next actions clear for couples, families, and assigned collaborators."],
  ["Budgets and expenses", "Set wedding and event budgets, then record expenses and payments made outside the app."],
  ["Nearby vendor discovery", "Find nearby vendors through Google Places and save selected vendors to My Vendors."],
  ["Guests, invitations, and RSVP", "Manage households, event guest lists, invitation links, and responses without guest accounts."],
  ["Wedding documents", "Keep quotations, contracts, invoices, and receipts with the wedding, event, vendor, or expense."],
] as const;

export const events = [
  { date: "15 Jan", name: "Mehendi evening", side: "Bride side", place: "Lotus Courtyard, Colombo", guests: "45 guests", budget: "LKR 300,000" },
  { date: "17 Jan", name: "Wedding ceremony", side: "Joint", place: "Harbour View Hall, Colombo", guests: "350 guests", budget: "LKR 2,100,000" },
  { date: "18 Jan", name: "Evening reception", side: "Joint", place: "Lakefront Pavilion, Colombo", guests: "280 guests", budget: "LKR 1,500,000" },
  { date: "24 Jan", name: "Family homecoming", side: "Groom side", place: "Hill Country Courtyard, Kandy", guests: "150 guests", budget: "LKR 650,000" },
] as const;

export const members = [
  { role: "Owner", person: "Ahamed & Fathima", detail: "Full wedding access" },
  { role: "Admin", person: "Nadeesha Perera", detail: "Bride-side events and delegated tasks" },
  { role: "Family Member", person: "Imran Farook", detail: "Permitted guest-management capabilities" },
  { role: "Collaborator", person: "Serendib Events", detail: "Only explicitly assigned event, task, vendor, and document access" },
] as const;

export const tasks = [
  { status: "To do", count: 7, items: ["Confirm ceremony florals", "Review family invitation list"] },
  { status: "In progress", count: 7, items: ["Prepare invitation links", "Confirm menu tasting date"] },
  { status: "Completed", count: 38, items: ["Record venue advance", "Add photographer quotation"] },
] as const;

export const documents = [
  ["Sample photography quotation", "Linked to Sample: Serendib Lens Studio"],
  ["Sample venue agreement", "Linked to Wedding ceremony"],
  ["Sample catering invoice", "Linked to Evening reception"],
] as const;
