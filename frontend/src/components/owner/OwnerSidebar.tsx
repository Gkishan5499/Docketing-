import React from "react";
import {
  Building2,
  CreditCard,
  KeyRound,
  LogOut,
  Settings2,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const navigation = [
  { label: "Firms & subscriptions", to: "/owner", icon: Building2, end: true },
  { label: "Access provisioning", to: "/owner/access", icon: KeyRound },
  { label: "Billing overview", to: "/owner/billing", icon: CreditCard },
  { label: "Platform settings", to: "/owner/settings", icon: Settings2 },
];

export const OwnerSidebar: React.FC = () => {
  const navigate = useNavigate();

  const logout = () => {
    fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    sessionStorage.removeItem("ld_owner_portal");
    navigate("/owner/login");
  };

  return (
    <aside className="owner-sidebar">
      <Link to="/" className="owner-brand">
        <span>LD</span>
        <strong>Lawyers Diary</strong>
        <small>Platform console</small>
      </Link>
      <div className="owner-nav-label">Manage</div>
      <nav aria-label="Owner platform navigation">
        {navigation.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `owner-nav-item${isActive ? " active" : ""}`
            }
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="owner-side-footer">
        <div className="owner-admin">
          <span>PA</span>
          <div>
            <strong>Platform Owner</strong>
            <small>Super Admin</small>
          </div>
        </div>
        <button type="button" onClick={logout} title="Sign out" aria-label="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
