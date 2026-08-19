"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@emt.local");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (!response.ok) throw new Error("Invalid email or password");
      router.push("/dashboard");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-aside"><div className="brand-mark"><span>+</span> EMT Admin</div><div className="login-aside-copy"><p className="eyebrow">Operations, made visible</p><h1>Keep every response moving.</h1><p>One calm view for dispatch, crews, and the people counting on them.</p></div><div className="aside-note"><span className="status-dot" /> All systems operational</div></section>
      <section className="login-panel"><div className="login-card"><p className="mobile-brand"><span>+</span> EMT Admin</p><p className="eyebrow">Welcome back</p><h2>Sign in to your workspace</h2><p className="muted">Use your admin credentials to continue.</p><form onSubmit={handleSubmit} className="login-form"><label htmlFor="email">Work email</label><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><div className="label-row"><label htmlFor="password">Password</label><a href="#forgot">Forgot password?</a></div><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" disabled={isLoading}>{isLoading ? "Signing in..." : "Sign in"}<span aria-hidden="true">-&gt;</span></button></form><p className="demo-hint">Demo access: <strong>admin@emt.local</strong> / <strong>password</strong></p></div></section>
    </main>
  );
}
