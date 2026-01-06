import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { AuroraText } from './aurora-text';
import { ShineBorder } from './shine-border';

const PRODUCTS = [
  { title: "Generator cennika", href: "/start-generator" },
  { title: "Audyt Booksy", href: "/start-audit" },
  { title: "Optymalizacja AuditorAI®", href: "#" },
  { title: "Cennik", href: "/#pricing" },
];

const CAMPAIGNS = [
  { title: "Meta Ads", href: "/campaigns/meta", icon: "/fb.svg" },
  { title: "Google Ads", href: "/campaigns/google", icon: "/g-only.png" },
];

const LEGALS = [
  { title: "Regulamin", href: "/regulamin" },
  { title: "Polityka prywatności", href: "/prywatnosc" },
  { title: "Polityka cookies", href: "/cookies" },
];

const ACCOUNT = [
  { title: "Zaloguj się", href: "/sign-in" },
  { title: "Zarejestruj się", href: "/sign-up" },
  { title: "Mój profil", href: "/profile" },
];

interface FooterProps {
  showContactCTA?: boolean;
}

const Footer: React.FC<FooterProps> = ({ showContactCTA = false }) => {
  return (
    <footer className={`${showContactCTA ? '' : 'mt-20'} bg-gray-50`}>
      {/* Contact CTA Section */}
      {showContactCTA && (
        <section className="py-10 bg-white">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div className="relative bg-white rounded-lg p-8 md:p-12 overflow-visible shadow-sm">
                <ShineBorder
                  borderWidth={2}
                  duration={10}
                  shineColor={["#D4A574", "#B8860B", "#D4A574"]}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/40 to-transparent pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
                  <div className="lg:col-span-3 flex flex-col justify-center">
                    <h2 className="text-2xl md:text-3xl font-serif text-slate-900 leading-snug">
                      Potrzebujesz profesjonalnej strony internetowej i kampanii reklamowej?{' '}
                      <AuroraText className="font-bold">Porozmawiajmy.</AuroraText>
                    </h2>
                    <p className="mt-6 text-slate-600 leading-relaxed">
                      Pomagamy{' '}
                      <span className="text-[#D4A574] font-medium">
                        salonom beauty i klinikom medycyny estetycznej
                      </span>{' '}
                      budować profesjonalną obecność online od podstaw - od strony internetowej,
                      przez kampanie reklamowe, po kompleksową strategię marketingową.
                    </p>
                    <a
                      href="mailto:kontakt@beautyaudit.pl"
                      className="mt-8 px-8 py-3 bg-[#171717] text-white text-sm font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors w-fit"
                    >
                      Napisz do nas
                    </a>
                  </div>

                  <div className="lg:col-span-2 flex items-end justify-end -mr-12 -mb-12 mt-auto relative">
                    <div className="absolute bottom-16 -left-4 flex flex-col items-end">
                      <span className="text-slate-500 text-sm">Do usłyszenia,</span>
                      <span className="text-slate-600 text-3xl" style={{ fontFamily: 'Birthstone, cursive' }}>
                        Joanna Kuflewicz
                      </span>
                    </div>
                    <img
                      alt="Joanna Kuflewicz"
                      className="max-w-[280px] h-auto -mt-20"
                      src="/asia.png"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        {/* Header section */}
        <div className="border-b border-neutral-200 pb-2">
          <div className="mb-10 max-w-xl">
            <Logo />
            <p className="mb-4 text-sm text-neutral-600">
              Narzędzia AI dla branży beauty. Generuj profesjonalne cenniki,
              analizuj konkurencję i optymalizuj ofertę z pomocą AuditorAI®.
            </p>
            <div className="text-sm text-neutral-700">
              Produkt stworzony przez{" "}
              <a
                href="https://kolabo.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-neutral-800 underline"
              >
                Kolabo
              </a>
            </div>
          </div>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-2 gap-10 border-b border-neutral-200 pt-10 pb-10 md:grid-cols-4">
          <FooterColumn title="Produkty" items={PRODUCTS} />
          <FooterColumnWithIcons title="Kampanie reklamowe" items={CAMPAIGNS} />
          <FooterColumn title="Prawne" items={LEGALS} />
          <FooterColumn title="Konto" items={ACCOUNT} />
        </div>

        {/* Copyright */}
        <p className="mb-4 pt-10 text-sm text-neutral-600">
          &copy; {new Date().getFullYear()} BooksyAudit.pl. Wszelkie prawa zastrzeżone.
        </p>
      </div>
    </footer>
  );
};

interface FooterColumnProps {
  title: string;
  items: { title: string; href: string }[];
}

const FooterColumn: React.FC<FooterColumnProps> = ({ title, items }) => {
  return (
    <ul className="text-base font-medium text-neutral-800">
      <li className="mb-4 text-sm font-bold text-black">
        {title}
      </li>
      {items.map((item, idx) => (
        <li key={idx} className="mb-4 text-sm font-normal">
          {item.href.startsWith('http') ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 hover:text-black"
            >
              {item.title}
            </a>
          ) : item.href.startsWith('#') || item.href.startsWith('/#') ? (
            <a href={item.href} className="text-neutral-500 hover:text-black">
              {item.title}
            </a>
          ) : (
            <Link to={item.href} className="text-neutral-500 hover:text-black">
              {item.title}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
};

interface FooterColumnWithIconsProps {
  title: string;
  items: { title: string; href: string; icon: string }[];
}

const FooterColumnWithIcons: React.FC<FooterColumnWithIconsProps> = ({ title, items }) => {
  return (
    <ul className="text-base font-medium text-neutral-800">
      <li className="mb-4 text-sm font-bold text-black">
        {title}
      </li>
      {items.map((item, idx) => (
        <li key={idx} className="mb-4 text-sm font-normal">
          <Link to={item.href} className="flex items-center gap-2 text-neutral-500 hover:text-black">
            <img src={item.icon} alt="" className="h-4 w-4 object-contain" />
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  );
};

const Logo: React.FC = () => {
  return (
    <Link
      to="/"
      className="flex flex-shrink-0 items-center space-x-2 py-6 text-2xl font-bold text-neutral-600"
    >
      <img src="/logo2.png" alt="BooksyAudit" className="h-8" />
    </Link>
  );
};

export default Footer;
