import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Settings,
  Sparkles,
  Menu,
  Crown,
  X
} from 'lucide-react';

type Page = 'home' | 'generator' | 'audit' | 'settings';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onOpenPaywall?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, onOpenPaywall }) => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Pobierz dane użytkownika z Convex (kredyty)
  const user = useQuery(api.users.getCurrentUser);
  const credits = user?.credits ?? 0;

  const navItems = [
    { id: 'generator' as Page, label: 'Generator', icon: FileText, premium: false },
    { id: 'audit' as Page, label: 'Audyt AI', icon: Search, premium: true },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.premium && !isSignedIn) {
      onOpenPaywall?.();
      return;
    }
    navigate(`/${item.id}`);
    setMobileMenuOpen(false);
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
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold text-[#722F37] leading-none group-hover:text-[#B76E79] transition-colors">
                Beauty Audit
              </span>
              <span className="font-handwriting text-lg text-[#B76E79] -mt-1 ml-auto transform -rotate-2">
                by Alex M.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${currentPage === item.id
                    ? 'bg-[#722F37]/10 text-[#722F37]'
                    : 'text-slate-600 hover:text-[#722F37] hover:bg-slate-50'
                  }
                `}
              >
                <item.icon size={18} />
                {item.label}
                {item.premium && (
                  <Sparkles size={14} className="text-[#D4AF37]" />
                )}
              </button>
            ))}

            {isSignedIn && (
              <Link
                to="/settings"
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${currentPage === 'settings'
                    ? 'bg-[#722F37]/10 text-[#722F37]'
                    : 'text-slate-600 hover:text-[#722F37] hover:bg-slate-50'
                  }
                `}
              >
                <Settings size={18} />
                Ustawienia
              </Link>
            )}
          </div>

          {/* Right side - Auth & Credits */}
          <div className="flex items-center gap-3">

            {/* Credits Badge */}
            {isSignedIn && credits > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#B76E79]/10 to-[#D4AF37]/10 rounded-full border border-[#D4AF37]/30">
                <Crown size={14} className="text-[#D4AF37]" />
                <span className="text-sm font-semibold text-[#722F37]">
                  {credits} {credits === 1 ? 'kredyt' : 'kredyty'}
                </span>
              </div>
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
              className="md:hidden p-2 text-slate-600 hover:text-[#722F37] rounded-lg"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 animate-in slide-in-from-top-2">
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                    ${currentPage === item.id
                      ? 'bg-[#722F37]/10 text-[#722F37]'
                      : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                  {item.premium && (
                    <Sparkles size={14} className="text-[#D4AF37] ml-auto" />
                  )}
                </button>
              ))}

              {isSignedIn && (
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                    ${currentPage === 'settings'
                      ? 'bg-[#722F37]/10 text-[#722F37]'
                      : 'text-slate-600 hover:bg-slate-50'
                    }
                  `}
                >
                  <Settings size={20} />
                  <span className="font-medium">Ustawienia</span>
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
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
