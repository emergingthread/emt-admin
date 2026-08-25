import Link from "next/link";
import { Construction } from "lucide-react";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <section className="not-found-card" aria-labelledby="not-found-title">
        <div className="not-found-icon"><Construction aria-hidden="true" size={32} strokeWidth={1.7} /></div>
        <p className="eyebrow">Coming soon</p>
        <h1 id="not-found-title">This page is under construction.</h1>
        <p className="muted">The feature you&apos;re looking for is not available yet. We&apos;re working on it.</p>
        <div className="not-found-actions">
          <Link className="primary-button" href="/dashboard">Back to dashboard</Link>
          <Link className="outline-button" href="/">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
