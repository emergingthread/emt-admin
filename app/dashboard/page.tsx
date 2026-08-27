import Header from "@/app/components/Header";
import Sidebar from "@/app/components/Sidebar";

const dummyIncidents = [
  { id: 1, title: "Road traffic collision", district: "Central District", status: "active", assignedToId: 12 },
  { id: 2, title: "Medical emergency", district: "North District", status: "active", assignedToId: 7 },
  { id: 3, title: "Patient transfer completed", district: "West District", status: "resolved", assignedToId: 4 },
];

export default function Dashboard() {
  const incidents = dummyIncidents;
  const activeIncidents = incidents.filter((incident) => incident.status === "active").length;
  const resolvedToday = incidents.filter((incident) => incident.status === "resolved").length;
  const assignedIncidents = incidents.filter((incident) => incident.assignedToId !== null).length;
  const districtCounts = incidents.reduce<Record<string, number>>((counts, incident) => ({ ...counts, [incident.district]: (counts[incident.district] ?? 0) + 1 }), {});
  const districts = Object.entries(districtCounts);
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <main className="dashboard-main">
        <Header
          eyebrow="Wednesday, August 19, 2026"
          title="Welcome"
        />
        <div className="dashboard-content">
          <div className="section-heading">
            <div>
              <h2>Today&apos;s overview</h2>
              <p className="muted">A live pulse of your operation.</p>
            </div>
            <button className="outline-button">
              Export report <span>↓</span>
            </button>
          </div>
          <section className="stats-grid" aria-label="Overview statistics">
            <article className="stat-card">
              <span className="stat-icon blue-icon">◈</span>
              <p>Active incidents</p>
              <strong>{activeIncidents}</strong>
            </article>
            <article className="stat-card">
              <span className="stat-icon green-icon">◌</span>
              <p>Units available</p>
              <strong>
                {assignedIncidents}
              </strong>
            </article>
            <article className="stat-card">
              <span className="stat-icon amber-icon">◷</span>
              <p>Avg. response time</p>
              <strong>—</strong>
            </article>
            <article className="stat-card">
              <span className="stat-icon red-icon">✓</span>
              <p>Resolved today</p>
              <strong>{resolvedToday}</strong>
            </article>
          </section>
          <section className="lower-grid">
            <article className="panel activity-panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent activity</h2>
                  <p className="muted">The latest updates from your teams.</p>
                </div>
                <a href="#activity">View all</a>
              </div>
              {incidents.map((incident, index) => (
                <div className="activity-row" key={incident.id}>
                  <span className={`activity-dot ${["blue", "green", "amber"][index % 3]}`} />
                  <div>
                    <strong>{incident.title}</strong>
                    <p>{incident.district} · {incident.status}</p>
                  </div>
                  <span className="activity-arrow">-&gt;</span>
                </div>
              ))}
            </article>
            <article className="panel coverage-panel">
              <div className="panel-heading">
                <div>
                  <h2>District coverage</h2>
                  <p className="muted">Units currently in service.</p>
                </div>
                <a href="#map">Details</a>
              </div>
              <div className="coverage-chart">
                <div className="chart-ring">
                  <strong>{incidents.length ? `${Math.round((assignedIncidents / incidents.length) * 100)}%` : "—"}</strong>
                  <span>covered</span>
                </div>
                <div className="legend">
                  {districts.map(([district, count], index) => <span key={district}><i className={["green", "blue", "amber"][index % 3]} /> {district} <b>{count}</b></span>)}
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
