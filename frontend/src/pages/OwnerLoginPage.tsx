import React, { FormEvent, useState } from "react";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const OwnerLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || password.length < 8) {
      setError("Enter the platform owner email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok || result.data?.user?.role !== "SUPER_ADMIN") {
        throw new Error(
          result.message || "Only a Super Admin can enter the owner portal.",
        );
      }
      sessionStorage.setItem("ld_owner_portal", "true");
      navigate("/owner");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in to the owner portal.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="owner-login-page">
      <section className="owner-login-card">
        <div className="owner-login-mark">
          <KeyRound size={22} />
        </div>
        <p className="owner-kicker">Platform administration</p>
        <h1>Owner portal</h1>
        <p className="owner-login-copy">
          Manage subscribed firms, plans, seats, and secure lawyer access from
          one private console.
        </p>
        <form onSubmit={submit} className="owner-login-form">
          <label>
            Owner email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="owner@lawyersdiary.in"
            />
          </label>
          <label>
            Owner password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </label>
          {error && <p className="owner-login-error">{error}</p>}
          <button
            className="button button-primary owner-login-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Checking access..." : "Enter owner portal"}{" "}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
        <div className="owner-login-note">
          <ShieldCheck size={16} /> This area is separate from lawyer practice
          workspaces.
        </div>
        <Link className="owner-back-link" to="/">
          Back to Lawyers Diary
        </Link>
      </section>
    </main>
  );
};
