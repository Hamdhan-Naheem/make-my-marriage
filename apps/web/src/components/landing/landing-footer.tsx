import { BrandMark } from "./brand-mark";

export function LandingFooter() {
  return <footer className="border-t border-[#e8dfd8] bg-[#f6f3f2]"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8"><div><BrandMark /><p className="mt-3 max-w-sm text-sm leading-6 text-[#554243]">Wedding planning can be complicated. Managing it should feel calm, clear, and shared.</p></div><div className="text-sm text-[#554243]"><p>Built for Sri Lankan couples and families.</p><p className="mt-1">© 2026 Make My Marriage</p></div></div></footer>;
}
