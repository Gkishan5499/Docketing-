import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';

export interface LandingHeaderProps {
  className?: string;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ className = '' }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen]);

  // Handle navigation to sections
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    setMobileOpen(false);
    if (location.pathname === '/') {
      e.preventDefault();
      if (targetId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      e.preventDefault();
      navigate(`/#${targetId}`);
    }
  };

  const navLinks = [
    { label: 'Platform', targetId: 'product' },
    { label: 'Plans', targetId: 'plans' },
    { label: 'Security', targetId: 'security' },
    { label: 'Contact', targetId: 'contact' },
  ];

  return (
    <>
      <header
        className={`marketing-nav sticky top-0 z-50 w-full flex items-center justify-between px-6 sm:px-10 lg:px-16 transition-all duration-300 backdrop-blur-xl border-b ${
          isScrolled
            ? 'bg-white/95 shadow-md shadow-slate-900/5 border-slate-200/80 py-2.5 h-[62px]'
            : 'bg-white/90 shadow-xs border-slate-100 py-3 h-[68px]'
        } ${className}`.trim()}
      >
        <a
          className="marketing-brand inline-flex items-center gap-2 group transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
          href="#top"
          onClick={(e) => handleNavClick(e, 'top')}
          aria-label="DexFora home"
        >
          <img
            src="/logo.png"
            alt="DexFora"
            className="marketing-nav-logo h-7 sm:h-8 max-h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </a>

        <button
          className="marketing-menu inline-flex md:hidden items-center justify-center p-2.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100/80 active:bg-slate-200/60 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} className="transition-transform duration-200" /> : <Menu size={22} />}
        </button>

        <nav
          className={`marketing-links items-center gap-1.5 md:gap-2 lg:gap-3 text-sm font-semibold tracking-wide ${
            mobileOpen
              ? 'flex flex-col absolute top-full left-0 right-0 bg-white/98 backdrop-blur-2xl border-b border-slate-200 p-6 shadow-xl space-y-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200'
              : 'hidden md:flex'
          }`}
          aria-label="Main Navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.targetId}
              href={`#${link.targetId}`}
              onClick={(e) => handleNavClick(e, link.targetId)}
              className="text-slate-700 hover:text-blue-600 px-3.5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:bg-blue-50/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {link.label}
            </a>
          ))}
          <Link
            className="marketing-login inline-flex items-center justify-center gap-2 ml-0 md:ml-3 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 group"
            to="/login"
            onClick={() => setMobileOpen(false)}
          >
            <span>Login</span>
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </nav>
      </header>

      {/* Backdrop overlay for mobile menu */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-[68px] bg-slate-900/20 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export const Header = LandingHeader;
export default LandingHeader;
