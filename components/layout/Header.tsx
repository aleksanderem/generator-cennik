import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  FileText,
  Search,
  Menu,
  Crown,
  X,
  Play,
  User,
  Wand2,
  ChevronDown,
} from 'lucide-react';
import { IconBrandMeta, IconBrandGoogle } from '@tabler/icons-react';
import { AuroraText } from '../ui/aurora-text';
import { PulsatingButton } from '../ui/pulsating-button';

type Page = 'home' | 'generator' | 'audit' | 'optimization' | 'campaigns-meta' | 'campaigns-google' | 'agency' | 'profile';

interface NavSubItem {
  id: Page | string;
  label: string;
  premium?: boolean;
  comingSoon?: boolean;
  href?: string;
  icon?: 'meta' | 'google';
}

interface NavItem {
  id: string;
  label: string;
  premium?: boolean;
  href?: Page;
  children?: NavSubItem[];
}

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onOpenPaywall?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, onOpenPaywall }) => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState<string | null>(null);

  // Pobierz dane użytkownika z Convex (kredyty)
  const user = useQuery(api.users.getCurrentUser);
  const credits = user?.credits ?? 0;

  // Pobierz aktywny audyt (pending lub processing)
  const activeAudit = useQuery(api.audits.getActiveAudit);
  const hasProcessing = activeAudit?.status === 'processing';
  const hasPending = activeAudit?.status === 'pending';

  const navItems: NavItem[] = [
    { id: 'audit', label: 'Audyt Booksy', premium: true, href: 'audit' },
    {
      id: 'cennik',
      label: 'Cennik',
      children: [
        { id: 'generator', label: 'Generator cennika' },
        { id: 'optimization', label: 'Optymalizacja cennika', premium: true, comingSoon: true },
      ],
    },
    {
      id: 'kampanie',
      label: 'Kampanie',
      children: [
        { id: 'campaigns-meta', label: 'Meta Ads', icon: 'meta' },
        { id: 'campaigns-google', label: 'Google Ads', icon: 'google' },
        { id: 'agency', label: 'Agencja 360', comingSoon: true },
      ],
    },
  ];

  const handleItemClick = (item: NavSubItem | NavItem, e?: React.MouseEvent) => {
    const subItem = item as NavSubItem;

    if (subItem.comingSoon) {
      return;
    }
    if (subItem.premium && !isSignedIn) {
      onOpenPaywall?.();
      return;
    }

    const targetId = (item as NavItem).href || item.id;
    navigate(`/${targetId}`);
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
          >
            <img src="/logo2.png" alt="BooksyAudit" className="h-6" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => item.children && setOpenDropdown(item.id)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.children ? (
                  // Dropdown trigger
                  <button
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${openDropdown === item.id
                        ? 'bg-slate-50 text-[#722F37]'
                        : 'text-slate-600 hover:text-[#722F37] hover:bg-slate-50'
                      }
                    `}
                  >
                    {item.label}
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${openDropdown === item.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  // Direct link
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`
                      flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${currentPage === item.href
                        ? 'bg-[#722F37]/10 text-[#722F37]'
                        : 'text-slate-600 hover:text-[#722F37] hover:bg-slate-50'
                      }
                    `}
                  >
                    {item.label}
                    {item.premium && (
                      <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                        PRO
                      </span>
                    )}
                  </button>
                )}

                {/* Dropdown menu */}
                {item.children && openDropdown === item.id && (
                  <div className="absolute top-[calc(100%-4px)] left-0 py-2 bg-white rounded-xl shadow-lg border border-slate-200 min-w-[180px] before:absolute before:-top-3 before:left-0 before:right-0 before:h-4 before:bg-transparent">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => handleItemClick(child)}
                        disabled={child.comingSoon}
                        className={`
                          w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors whitespace-nowrap
                          ${child.comingSoon
                            ? 'text-slate-400 cursor-not-allowed'
                            : currentPage === child.id
                              ? 'bg-[#722F37]/5 text-[#722F37]'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-[#722F37]'
                          }
                        `}
                      >
                        <span className="flex items-center gap-2">
                          {child.icon === 'meta' && <IconBrandMeta size={18} className="text-[#0081FB]" />}
                          {child.icon === 'google' && <img src="/g-only.png" alt="Google" className="w-[18px] h-[18px]" />}
                          {child.label}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {child.premium && (
                            <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                              PRO
                            </span>
                          )}
                          {child.comingSoon && (
                            <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              soon
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right side - Auth & Credits */}
          <div className="flex items-center gap-3">

            {/* Audyt w trakcie - mrugająca lampka */}
            {isSignedIn && hasProcessing && (
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-sm font-medium text-amber-700">
                  Audyt w trakcie
                </span>
              </Link>
            )}

            {/* Rozpocznij audyt - dla użytkowników z pending audytem lub kredytami */}
            {isSignedIn && (hasPending || (credits > 0 && !activeAudit)) && (
              <Link to="/start-audit" className="hidden sm:block">
                <PulsatingButton
                  pulseColor="#D4A574"
                  className="bg-gradient-to-r from-[#D4A574] to-[#B8860B] text-white text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Play size={14} />
                    Rozpocznij audyt
                  </span>
                </PulsatingButton>
              </Link>
            )}

            {/* Credits Badge */}
            {isSignedIn && credits > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#B76E79]/10 to-[#D4AF37]/10 rounded-full border border-[#D4AF37]/30">
                <Crown size={14} className="text-[#D4AF37]" />
                <span className="text-sm font-semibold text-[#722F37]">
                  {credits} {credits === 1 ? 'kredyt' : 'kredyty'}
                </span>
              </div>
            )}

            {/* Profile Link */}
            {isSignedIn && (
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-[#722F37] transition-colors"
              >
                <User size={16} />
                Profil
              </Link>
            )}

            {/* Auth Buttons */}
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: 'w-9 h-9 ring-2 ring-[#B76E79]/20'
                      }
                    }}
                  />
                ) : (
                  <div className="hidden sm:flex items-center gap-2">
                    <SignInButton mode="modal">
                      <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#722F37] transition-colors">
                        Zaloguj
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-4 py-2 text-sm font-medium text-white bg-[#722F37] hover:bg-[#5a252c] rounded-lg transition-colors">
                        Zarejestruj
                      </button>
                    </SignUpButton>
                  </div>
                )}
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-[#722F37] rounded-lg"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 animate-in slide-in-from-top-2">
            <div className="space-y-1">
              {navItems.map((item) => (
                <div key={item.id}>
                  {item.children ? (
                    // Expandable menu item
                    <>
                      <button
                        onClick={() => setMobileExpandedMenu(mobileExpandedMenu === item.id ? null : item.id)}
                        className={`
                          w-full flex items-center justify-between px-4 py-3 rounded-lg text-left
                          ${mobileExpandedMenu === item.id
                            ? 'bg-slate-50 text-[#722F37]'
                            : 'text-slate-600'
                          }
                        `}
                      >
                        <span className="font-medium">{item.label}</span>
                        <ChevronDown
                          size={18}
                          className={`transition-transform ${mobileExpandedMenu === item.id ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {/* Mobile submenu */}
                      {mobileExpandedMenu === item.id && (
                        <div className="ml-4 pl-4 border-l-2 border-slate-100 space-y-1 mt-1">
                          {item.children.map((child) => (
                            <button
                              key={child.id}
                              onClick={() => handleItemClick(child)}
                              disabled={child.comingSoon}
                              className={`
                                w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm text-left
                                ${child.comingSoon
                                  ? 'text-slate-400 cursor-not-allowed'
                                  : currentPage === child.id
                                    ? 'bg-[#722F37]/5 text-[#722F37]'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }
                              `}
                            >
                              <span>{child.label}</span>
                              <span className="flex items-center gap-1.5">
                                {child.premium && (
                                  <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                                    PRO
                                  </span>
                                )}
                                {child.comingSoon && (
                                  <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    soon
                                  </span>
                                )}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    // Direct link
                    <button
                      onClick={() => handleItemClick(item)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-lg text-left
                        ${currentPage === item.href
                          ? 'bg-[#722F37]/10 text-[#722F37]'
                          : 'text-slate-600 hover:bg-slate-50'
                        }
                      `}
                    >
                      <span className="font-medium">{item.label}</span>
                      {item.premium && (
                        <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">
                          PRO
                        </span>
                      )}
                    </button>
                  )}
                </div>
              ))}

              {isSignedIn && (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                    ${currentPage === 'profile'
                      ? 'bg-[#722F37]/10 text-[#722F37]'
                      : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  <User size={20} />
                  <span className="font-medium">Profil</span>
                </Link>
              )}

              {!isSignedIn && isLoaded && (
                <div className="flex gap-2 pt-3 mt-3 border-t border-slate-100">
                  <SignInButton mode="modal">
                    <button className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg">
                      Zaloguj
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#722F37] rounded-lg">
                      Zarejestruj
                    </button>
                  </SignUpButton>
                </div>
              )}

              {isSignedIn && credits > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 mt-2 bg-gradient-to-r from-[#B76E79]/10 to-[#D4AF37]/10 rounded-lg">
                  <Crown size={16} className="text-[#D4AF37]" />
                  <span className="text-sm font-semibold text-[#722F37]">
                    {credits} {credits === 1 ? 'kredyt' : 'kredyty'}
                  </span>
                </div>
              )}

              {/* Mobile: Audyt w trakcie */}
              {isSignedIn && hasProcessing && (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 mt-2 bg-amber-50 rounded-lg border border-amber-200"
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                  <span className="text-sm font-medium text-amber-700">
                    Audyt w trakcie
                  </span>
                </Link>
              )}

              {/* Mobile: Rozpocznij audyt */}
              {isSignedIn && (hasPending || (credits > 0 && !activeAudit)) && (
                <Link
                  to="/start-audit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-gradient-to-r from-[#D4A574] to-[#B8860B] text-white rounded-lg font-medium"
                >
                  <Play size={16} />
                  Rozpocznij audyt
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
