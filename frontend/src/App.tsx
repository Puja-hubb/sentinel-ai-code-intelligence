
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Code2,
  GitPullRequest,
  ShieldCheck,
  Sparkles,
  ScanSearch,
  AlertTriangle,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";

type Health = {
  status: string;
  service: string;
  version: string;
};

type Finding = {
  rule_id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  line: number;
  recommendation: string;
};

type ScanResponse = {
  filename: string;
  language: string;
  findings: Finding[];
  findings_count: number;
};

type ScanHistoryItem = {
  id: number;
  filename: string;
  language: string;
  created_at: string;
  findings_count: number;
};

type ScanHistoryDetail = ScanHistoryItem & {
  findings: Finding[];
};
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8080";

const SAMPLE_CODE = `import os

password = "mysecret123"

user_input = input("Enter an expression: ")
result = eval(user_input)

os.system("echo Scan complete")
print(result)
`;

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [apiError, setApiError] = useState("");
  const [filename, setFilename] = useState("example.py");
  const [code, setCode] = useState(SAMPLE_CODE);
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  async function loadScanHistory() {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(`${API_BASE}/api/scans`);
      if (!response.ok) {
        throw new Error(`History request failed with HTTP ${response.status}`);
      }

      const data = (await response.json()) as { scans: ScanHistoryItem[] };
      setScanHistory(data.scans);
    } catch (error: unknown) {
      setHistoryError(
        error instanceof Error ? error.message : "Could not load scan history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    void loadScanHistory();
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((response) => {
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        return response.json() as Promise<Health>;
      })
      .then((data) => {
        setHealth(data);
        setApiError("");
      })
      .catch((error: unknown) => {
        setApiError(
          error instanceof Error ? error.message : "Could not reach API",
        );
      });
  }, []);

  async function viewHistoricalScan(scanId: number) {
    setHistoryError("");

    try {
      const response = await fetch(`${API_BASE}/api/scans/${scanId}`);
      if (!response.ok) {
        throw new Error(`Could not load scan details (HTTP ${response.status})`);
      }

      const result = (await response.json()) as ScanHistoryDetail;
      setScan({
        filename: result.filename,
        language: result.language,
        findings: result.findings,
        findings_count: result.findings_count,
      });
      setSelectedHistoryId(result.id);
      setScanError("");
    } catch (error: unknown) {
      setHistoryError(
        error instanceof Error ? error.message : "Could not load saved scan.",
      );
    }
  }

  async function runScan() {
    setScanning(true);
    setScanError("");
    setScan(null);

    try {
      const response = await fetch(`${API_BASE}/api/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, code }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(
          typeof detail?.detail === "string"
            ? detail.detail
            : `Scan failed with HTTP ${response.status}`,
        );
      }

      const result = (await response.json()) as ScanResponse;
      setScan(result);
      setSelectedHistoryId(null);
      await loadScanHistory();
    } catch (error: unknown) {
      setScanError(
        error instanceof Error ? error.message : "Unable to scan this code.",
      );
    } finally {
      setScanning(false);
    }
  }

  const severityCount = (severity: Finding["severity"]) =>
    scan?.findings.filter((finding) => finding.severity === severity).length ?? 0;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><ShieldCheck size={22} /></div>
        <div className="brand-copy">
          <strong>SentinelAI</strong>
          <span>CODE INTELLIGENCE</span>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <div className="nav-item active"><Activity size={17} /> Overview</div>
        <div className="nav-item"><Code2 size={17} /> Code scans</div>
        <div className="nav-item muted"><GitPullRequest size={17} /> Pull requests <span className="soon">SOON</span></div>
        <div className="sidebar-bottom"><div className="status-dot" /> Local development</div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div>
            <span className="eyebrow">DEVELOPER SECURITY WORKSPACE</span>
            <h1>Code analysis</h1>
          </div>
          <div className="version-pill"><span className="status-dot" /> SentinelAI v0.2.0</div>
        </header>

        <section className="hero-card">
          <div className="hero-content">
            <div className="hero-tag"><Sparkles size={14} /> CODE YOU CAN TRUST</div>
            <h2>Find issues before<br />they reach production.</h2>
            <p>Scan Python code for potentially risky patterns and review actionable findings.</p>
            <button
              className="primary-button"
              onClick={() => document.getElementById("code-editor")?.focus()}
            >
              Start a code scan <ArrowUpRight size={16} />
            </button>
            <div className="hero-note">Rule-based Python scanning is enabled.</div>
          </div>
          <div className="hero-graphic" aria-hidden="true">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="shield-graphic"><ShieldCheck size={64} strokeWidth={1.3} /></div>
            <div className="float-chip chip-top"><CheckCircle2 size={15} /> Code inspection</div>
            <div className="float-chip chip-bottom"><Code2 size={15} /> Security findings</div>
          </div>
        </section>

        <div className="section-heading">
          <div>
            <h3>System status</h3>
            <p>Your local development services</p>
          </div>
        </div>

        <section className="status-grid">
          <article className="status-card">
            <div className="card-icon purple"><Activity size={18} /></div>
            <div className="card-label">Backend API</div>
            <div className="card-value">{health ? "Connected" : apiError ? "Offline" : "Checking..."}</div>
            <div className={`card-foot ${health ? "good" : apiError ? "bad" : ""}`}>
              {health ? `${health.service} Â· v${health.version}` : apiError ? "Start the FastAPI server" : "Checking health endpoint"}
            </div>
          </article>
          <article className="status-card">
            <div className="card-icon green"><ShieldCheck size={18} /></div>
            <div className="card-label">Analysis engine</div>
            <div className="card-value">{scan ? "Scan completed" : "Ready"}</div>
            <div className="card-foot">{scan ? `${scan.findings_count} finding(s) in latest scan` : "Python rule-based scanner"}</div>
          </article>
          <article className="status-card">
            <div className="card-icon blue"><GitPullRequest size={18} /></div>
            <div className="card-label">GitHub integration</div>
            <div className="card-value">Not connected</div>
            <div className="card-foot">OAuth will be added later</div>
          </article>
        </section>

        <section className="panel-card history-panel">
          <div className="panel-title">
            <div>
              <h3>Recent scans</h3>
              <p>Previously saved scan results</p>
            </div>
            <button
              className="secondary-button"
              onClick={() => void loadScanHistory()}
              disabled={historyLoading}
            >
              <RotateCcw size={15} />
              {historyLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {historyError && <p className="error-message">{historyError}</p>}

          {historyLoading && scanHistory.length === 0 ? (
            <p className="inline-note">Loading scan history...</p>
          ) : scanHistory.length === 0 ? (
            <p className="inline-note">No saved scans yet. Run your first scan to see it here.</p>
          ) : (
            <div className="history-list">
              {scanHistory.map((item) => (
                <article className="history-row" key={item.id}>
                  <div className="history-file-icon"><Code2 size={17} /></div>
                  <div className="history-details">
                    <strong>{item.filename}</strong>
                    <span>
                      {new Date(item.created_at).toLocaleString()} · {item.language}
                    </span>
                  </div>
                  <span className={`result-total ${item.findings_count ? "has-findings" : ""}`}>
                    {item.findings_count} finding(s)
                  </span>
                  <button
                    className="secondary-button history-view-button"
                    onClick={() => void viewHistoricalScan(item.id)}
                    disabled={selectedHistoryId === item.id}
                  >
                    {selectedHistoryId === item.id ? "Viewing" : "View scan"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel-card scan-panel">
          <div className="panel-title">
            <div>
              <h3><ScanSearch size={19} /> Scan source code</h3>
              <p>Paste Python code to check for known risky patterns.</p>
            </div>
            <span className="subtle">PYTHON</span>
          </div>

          <label className="field-label" htmlFor="filename">File name</label>
          <input
            id="filename"
            className="filename-input"
            value={filename}
            onChange={(event) => setFilename(event.target.value)}
            maxLength={200}
            placeholder="example.py"
          />

          <label className="field-label" htmlFor="code-editor">Source code</label>
          <textarea
            id="code-editor"
            className="code-editor"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            spellCheck={false}
            placeholder="Paste Python code here..."
            rows={12}
          />

          <div className="editor-footer">
            <span>{code.split("\n").length} lines Â· {code.length} characters</span>
            <div className="editor-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setCode("");
                  setScan(null);
                  setScanError("");
                }}
                disabled={scanning}
              >
                <RotateCcw size={15} /> Clear
              </button>
              <button
                className="primary-button"
                onClick={runScan}
                disabled={scanning || !code.trim() || !filename.trim() || !health}
              >
                {scanning ? <LoaderCircle size={16} className="spin" /> : <ScanSearch size={16} />}
                {scanning ? "Scanning..." : "Scan code"}
              </button>
            </div>
          </div>

          {!health && !apiError && <p className="inline-note">Connecting to the backend...</p>}
          {apiError && <p className="error-message">Backend unavailable: {apiError}</p>}
          {scanError && <p className="error-message"><AlertTriangle size={16} /> {scanError}</p>}
        </section>

        {scan && (
          <section className="panel-card results-panel">
            <div className="panel-title">
              <div>
                <h3>Scan results</h3>
                <p>{scan.filename} Â· {scan.language}</p>
              </div>
              <span className={`result-total ${scan.findings_count ? "has-findings" : ""}`}>
                {scan.findings_count} finding(s)
              </span>
            </div>

            <div className="finding-summary">
              <div><strong>{severityCount("critical")}</strong><span>Critical</span></div>
              <div><strong>{severityCount("high")}</strong><span>High</span></div>
              <div><strong>{severityCount("medium")}</strong><span>Medium</span></div>
              <div><strong>{severityCount("low")}</strong><span>Low</span></div>
            </div>

            {scan.findings_count === 0 ? (
              <div className="empty-results">
                <CheckCircle2 size={28} />
                <strong>No findings from the enabled rules</strong>
                <p>This does not guarantee the code is secure; the scanner checks a limited set of patterns.</p>
              </div>
            ) : (
              <div className="findings-list">
                {scan.findings.map((finding, index) => (
                  <article className="finding-card" key={`${finding.rule_id}-${finding.line}-${index}`}>
                    <div className="finding-heading">
                      <span className={`severity severity-${finding.severity}`}>{finding.severity}</span>
                      <span className="rule-id">{finding.rule_id}</span>
                      <span className="line-number">Line {finding.line}</span>
                    </div>
                    <h4>{finding.title}</h4>
                    <p>{finding.message}</p>
                    <div className="recommendation">
                      <strong>Recommendation</strong>
                      <p>{finding.recommendation}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <p className="disclaimer">Results are rule-based indicators, not a guarantee that all vulnerabilities have been detected.</p>
          </section>
        )}

        <section className="bottom-grid">
          <article className="panel-card">
            <div className="panel-title"><h3>Build roadmap</h3><span className="subtle">MILESTONE 02 / 06</span></div>
            <div className="roadmap-row complete">
              <div className="roadmap-check"><CheckCircle2 size={17} /></div>
              <div><strong>Project foundation</strong><p>Frontend shell and API health check</p></div>
              <span className="row-state">DONE</span>
            </div>
            <div className="roadmap-row complete">
              <div className="roadmap-check"><CheckCircle2 size={17} /></div>
              <div><strong>Static analysis engine</strong><p>Initial Python rules and findings API</p></div>
              <span className="row-state">BETA</span>
            </div>
            <div className="roadmap-row">
              <div className="roadmap-number">3</div>
              <div><strong>Scan history</strong><p>Persist results and support repeat scans</p></div>
            </div>
          </article>
          <article className="panel-card quickstart">
            <div className="panel-title"><h3>Quick start</h3><span className="subtle">LOCAL</span></div>
            <p>Run the API and frontend in separate terminals.</p>
            <div className="command-label">BACKEND</div><code>uvicorn app.main:app --reload</code>
            <div className="command-label">FRONTEND</div><code>npm run dev</code>
            <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer">Open API documentation <ArrowUpRight size={14} /></a>
          </article>
        </section>
        <footer>SentinelAI <span>Â·</span> Built for safer, more reliable software.</footer>
      </section>
    </main>
  );
}
