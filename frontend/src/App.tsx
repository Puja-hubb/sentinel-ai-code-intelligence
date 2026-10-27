import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, CheckCircle2, Code2, GitPullRequest, ShieldCheck, Sparkles } from "lucide-react";

type Health = { status: string; service: string; version: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8080";

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((response) => {
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        return response.json() as Promise<Health>;
      })
      .then(setHealth)
      .catch((error: unknown) => {
        setApiError(error instanceof Error ? error.message : "Could not reach API");
      });
  }, []);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><ShieldCheck size={22} /></div>
        <div className="brand-copy"><strong>SentinelAI</strong><span>CODE INTELLIGENCE</span></div>
        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item active"><Activity size={17} /> Overview</div>
        <div className="nav-item muted"><Code2 size={17} /> Code scans <span className="soon">SOON</span></div>
        <div className="nav-item muted"><GitPullRequest size={17} /> Pull requests <span className="soon">SOON</span></div>
        <div className="sidebar-bottom"><div className="status-dot" /> Local development</div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div><span className="eyebrow">DEVELOPER SECURITY WORKSPACE</span><h1>Overview</h1></div>
          <div className="version-pill"><span className="status-dot" /> Starter v0.1.0</div>
        </header>

        <section className="hero-card">
          <div className="hero-content">
            <div className="hero-tag"><Sparkles size={14} /> CODE YOU CAN TRUST</div>
            <h2>Find issues before<br />they reach production.</h2>
            <p>Analyze code, understand risks, and validate fixes in one developer-focused workspace.</p>
            <button className="primary-button" disabled title="Code scanning is the next milestone">
              Start your first scan <ArrowUpRight size={16} />
            </button>
            <div className="hero-note">Code scanning is coming in the next milestone.</div>
          </div>
          <div className="hero-graphic" aria-hidden="true">
            <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div>
            <div className="shield-graphic"><ShieldCheck size={64} strokeWidth={1.3} /></div>
            <div className="float-chip chip-top"><CheckCircle2 size={15} /> Verified workflow</div>
            <div className="float-chip chip-bottom"><Code2 size={15} /> Code intelligence</div>
          </div>
        </section>

        <div className="section-heading"><div><h3>System status</h3><p>Your local development services</p></div></div>
        <section className="status-grid">
          <article className="status-card">
            <div className="card-icon purple"><Activity size={18} /></div><div className="card-label">Backend API</div>
            <div className="card-value">{health ? "Connected" : apiError ? "Offline" : "Checking…"}</div>
            <div className={`card-foot ${health ? "good" : apiError ? "bad" : ""}`}>{health ? `${health.service} · v${health.version}` : apiError ? "Start the FastAPI server" : "Checking health endpoint"}</div>
          </article>
          <article className="status-card">
            <div className="card-icon green"><ShieldCheck size={18} /></div><div className="card-label">Analysis engine</div>
            <div className="card-value">Not configured</div><div className="card-foot">Next milestone: static analysis</div>
          </article>
          <article className="status-card">
            <div className="card-icon blue"><GitPullRequest size={18} /></div><div className="card-label">GitHub integration</div>
            <div className="card-value">Not connected</div><div className="card-foot">OAuth will be added later</div>
          </article>
        </section>

        <section className="bottom-grid">
          <article className="panel-card">
            <div className="panel-title"><h3>Build roadmap</h3><span className="subtle">MILESTONE 01 / 06</span></div>
            <div className="roadmap-row complete"><div className="roadmap-check"><CheckCircle2 size={17} /></div><div><strong>Project foundation</strong><p>Frontend shell and API health check</p></div><span className="row-state">STARTER</span></div>
            <div className="roadmap-row"><div className="roadmap-number">2</div><div><strong>Static analysis engine</strong><p>Scan source files and normalize findings</p></div><span className="row-state pending">NEXT</span></div>
            <div className="roadmap-row"><div className="roadmap-number">3</div><div><strong>Scan history</strong><p>Persist results and support repeat scans</p></div></div>
          </article>
          <article className="panel-card quickstart">
            <div className="panel-title"><h3>Quick start</h3><span className="subtle">LOCAL</span></div>
            <p>Start the API and frontend in two terminals to see the live connection status.</p>
            <div className="command-label">BACKEND</div><code>uvicorn app.main:app --reload</code>
            <div className="command-label">FRONTEND</div><code>npm run dev</code>
            <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer">Open API documentation <ArrowUpRight size={14} /></a>
          </article>
        </section>
        <footer>SentinelAI <span>·</span> Built for safer, more reliable software.</footer>
      </section>
    </main>
  );
}
