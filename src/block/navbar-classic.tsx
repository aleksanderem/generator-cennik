"use client";

import { useState } from "react";
import {
  IconChevronDown as ChevronDown,
  IconMenu2 as Menu,
  IconX as X,
  IconChevronRight as ChevronRight,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "motion/react";

const products = [
  { title: "Generator Cennika", desc: "Stwórz profesjonalny cennik", href: "#generator" },
  { title: "Audyt Booksy", desc: "Optymalizuj swój profil", href: "#audit" },
  { title: "Szablony", desc: "Gotowe rozwiązania", href: "#templates" },
  { title: "Integracje", desc: "Połącz z systemami", href: "#integrations" },
];
const resources = [
  { title: "Poradniki", desc: "Jak zwiększyć rezerwacje", href: "#guides" },
  { title: "Blog", desc: "Aktualności branżowe", href: "#blog" },
  { title: "FAQ", desc: "Najczęstsze pytania", href: "#faq" },
  { title: "Wsparcie", desc: "Pomoc techniczna", href: "#support" },
];

const tapProps = {
  whileTap: { scale: 0.98 },
  transition: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.6,
  },
};

export function NavbarMega() {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);

  return (
    <header className="bg-white w-full rounded-xl border border-slate-200 shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex w-full items-center justify-between gap-3 md:w-auto">
            <a href="#" className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <span className="font-semibold text-[#171717]">Beauty Audit</span>
            </a>
            <motion.button
              aria-label="Toggle menu"
              className="hover:bg-slate-100 inline-flex size-10 items-center justify-center rounded-md border border-slate-200 md:hidden"
              onClick={() => setOpen((s) => !s)}
              whileTap={{ scale: 0.92 }}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <div className="relative">
              <motion.button
                onMouseEnter={() => setMegaOpen(true)}
                onMouseLeave={() => setMegaOpen(false)}
                className="hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm"
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -1 }}>
                Produkty <ChevronDown size={16} />
              </motion.button>
              <AnimatePresence>
                {megaOpen && (
                  <motion.div
                    onMouseEnter={() => setMegaOpen(true)}
                    onMouseLeave={() => setMegaOpen(false)}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="bg-white absolute top-full left-0 z-20 mt-2 w-[42rem] rounded-xl p-4 border border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg p-3">
                        <p className="text-slate-400 px-1 pb-2 text-xs uppercase tracking-wide">
                          Produkty
                        </p>
                        <ul className="grid gap-2">
                          {products.map((p) => (
                            <li key={p.title}>
                              <motion.a
                                href={p.href}
                                className="hover:bg-slate-50 block rounded-md px-2 py-2"
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}>
                                <p className="text-sm font-medium text-slate-800">{p.title}</p>
                                <p className="text-slate-500 text-xs">
                                  {p.desc}
                                </p>
                              </motion.a>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg p-3">
                        <p className="text-slate-400 px-1 pb-2 text-xs uppercase tracking-wide">
                          Zasoby
                        </p>
                        <ul className="grid gap-2">
                          {resources.map((r) => (
                            <li key={r.title}>
                              <motion.a
                                href={r.href}
                                className="hover:bg-slate-50 block rounded-md px-2 py-2"
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}>
                                <p className="text-sm font-medium text-slate-800">{r.title}</p>
                                <p className="text-slate-500 text-xs">
                                  {r.desc}
                                </p>
                              </motion.a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <motion.a
              href="#pricing"
              className="hover:bg-slate-100 text-slate-700 rounded-md px-3 py-2 text-sm"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}>
              Cennik
            </motion.a>
            <motion.a
              href="#about"
              className="hover:bg-slate-100 text-slate-700 rounded-md px-3 py-2 text-sm"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}>
              O nas
            </motion.a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {/* CTA button - matches project theme */}
            <motion.button
              {...tapProps}
              className="hidden rounded-full bg-[#171717] px-6 py-2 text-sm font-semibold text-white shadow-[0px_-2px_0px_0px_rgba(255,255,255,0.4)_inset] hover:bg-[#2a2a2a] transition-colors md:block">
              Rozpocznij za darmo
            </motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="border-t border-slate-200 py-2 md:hidden">
              <details className="px-3">
                <summary
                  className="hover:bg-slate-100 flex cursor-pointer list-none items-center justify-between rounded-md px-0 py-2 text-sm text-slate-700">
                  <span>Produkty</span>
                  <ChevronDown size={16} />
                </summary>
                <div className="mt-2 rounded-lg border border-slate-200 p-2">
                  <p className="text-slate-400 px-1 pb-2 text-xs uppercase tracking-wide">
                    Produkty
                  </p>
                  <ul className="grid gap-1">
                    {products.map((p) => (
                      <li key={p.title}>
                        <motion.a
                          href={p.href}
                          className="hover:bg-slate-50 flex items-center justify-between rounded-md px-2 py-2 text-sm"
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800">{p.title}</p>
                            <p className="text-slate-500 text-xs">
                              {p.desc}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-slate-400 ml-3 shrink-0" />
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                  <p className="text-slate-400 px-1 pt-3 pb-2 text-xs uppercase tracking-wide">
                    Zasoby
                  </p>
                  <ul className="grid gap-1">
                    {resources.map((r) => (
                      <li key={r.title}>
                        <motion.a
                          href={r.href}
                          className="hover:bg-slate-50 flex items-center justify-between rounded-md px-2 py-2 text-sm"
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.98 }}>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800">{r.title}</p>
                            <p className="text-slate-500 text-xs">
                              {r.desc}
                            </p>
                          </div>
                          <ChevronRight size={16} className="text-slate-400 ml-3 shrink-0" />
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
              <motion.a
                href="#pricing"
                className="hover:bg-slate-100 flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-700"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}>
                <span>Cennik</span>
                <ChevronRight size={16} className="text-slate-400" />
              </motion.a>
              <motion.a
                href="#about"
                className="hover:bg-slate-100 flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-700"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}>
                <span>O nas</span>
                <ChevronRight size={16} className="text-slate-400" />
              </motion.a>
              <div className="flex items-center gap-2 px-3 pt-2">
                <motion.button
                  {...tapProps}
                  className="ml-auto rounded-full bg-[#171717] px-4 py-2 text-sm font-semibold text-white shadow-[0px_-2px_0px_0px_rgba(255,255,255,0.4)_inset]">
                  Rozpocznij za darmo
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// Keep default export for backwards compatibility
export default NavbarMega;
