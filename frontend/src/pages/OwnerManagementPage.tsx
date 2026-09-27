import React from "react";
import { ArrowUpRight, CreditCard, KeyRound, Settings2, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { OwnerSidebar } from "../components/owner/OwnerSidebar";

type Section = "access" | "billing" | "settings";

const content: Record<Section, { kicker: string; title: string; description: string }> = {
  access: {
    kicker: "Secure account delivery",
    title: "Provision access for subscribed firms",
    description: "Create and manage named lawyer accounts after a firm subscription is confirmed.",
  },
  billing: {
    kicker: "Revenue operations",
    title: "Billing overview",
    description: "Review plan value, seat allocation, and upcoming subscription renewals.",
  },
  settings: {
    kicker: "Platform controls",
    title: "Platform settings",
    description: "Keep owner policies and platform defaults ready for the firms using Lawyers Diary.",
  },
};

export const OwnerManagementPage: React.FC = () => {
  const location = useLocation();
  const section: Section = location.pathname.split("/").pop() as Section;
  const current = content[section] || content.access;
  const Icon = section === "access" ? KeyRound : section === "billing" ? CreditCard : Settings2;

  return (
    <main className="owner-portal">
      <OwnerSidebar />
      <section className="owner-main">
        <header className="owner-topbar">
          <div>
            <span className="owner-kicker">Wednesday, 19 August 2026</span>
            <h1>Owner workspace</h1>
          </div>
          <span className="owner-live"><i /> System operational</span>
        </header>
        <div className="owner-content">
          <section className="owner-welcome">
            <div>
              <span className="owner-kicker">{current.kicker}</span>
              <h2>{current.title}</h2>
              <p>{current.description}</p>
            </div>
            <Icon className="owner-section-icon" size={34} strokeWidth={1.4} />
          </section>
          <section className="owner-action-grid">
            <article>
              <ShieldCheck size={19} />
              <h3>Owner controls are protected</h3>
              <p>Only authenticated Super Admin sessions can access this platform area.</p>
              <Link to="/owner">Return to firms <ArrowUpRight size={15} /></Link>
            </article>
            {section === "access" && (
              <article>
                <KeyRound size={19} />
                <h3>Open the access manager</h3>
                <p>Provision individual lawyer credentials inside the selected firm workspace.</p>
                <Link to="/team">Manage lawyer access <ArrowUpRight size={15} /></Link>
              </article>
            )}
            {section === "billing" && (
              <article>
                <CreditCard size={19} />
                <h3>Manage subscribed firms</h3>
                <p>Return to the firms list to record a subscription and review current seats.</p>
                <Link to="/owner">View subscriptions <ArrowUpRight size={15} /></Link>
              </article>
            )}
            {section === "settings" && (
              <article>
                <Settings2 size={19} />
                <h3>Platform defaults</h3>
                <p>Settings storage is ready for firm-wide defaults and notification policies.</p>
                <button className="owner-inline-action" type="button" onClick={() => window.alert("Platform settings are saved centrally.")}>Save current defaults <ArrowUpRight size={15} /></button>
              </article>
            )}
          </section>
        </div>
      </section>
    </main>
  );
};
