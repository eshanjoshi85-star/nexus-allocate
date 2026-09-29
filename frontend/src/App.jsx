import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  Users,
  Settings,
  Search,
  Bell,
  Plus,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  Activity,
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  Database,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("nexus_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`
});

const DEMO_USERS = [
  { id: 1, name: "Admin User", role: "ADMIN", title: "Administrator", initials: "AU" },
  { id: 2, name: "Operations Manager", role: "MANAGER", title: "Manager", initials: "OM" },
  { id: 3, name: "Rahul Sharma", role: "EMPLOYEE", title: "Employee", initials: "RS" },
  { id: 4, name: "Priya Kumar", role: "EMPLOYEE", title: "Employee", initials: "PK" },
  { id: 5, name: "Arjun Mehta", role: "EMPLOYEE", title: "Employee", initials: "AM" },
];

function normalizeUser(user) {
  if (!user) return null;

  const name = user.name || user.email?.split("@")[0] || "User";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const role = String(user.role || "EMPLOYEE").toUpperCase();

  return {
    ...user,
    role,
    name,
    initials,
    title:
      role === "ADMIN"
        ? "Administrator"
        : role === "MANAGER"
        ? "Manager"
        : "Employee",
  };
}

function buildRequestTrend(requests) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    return date;
  });

  return days.map((date) => {
    const key = date.toISOString().slice(0, 10);

    // The API normally returns created_at. If an older backend response
    // does not include it, use the request's scheduled start_time so the
    // dashboard still visualizes real request data rather than fake values.
    const count = requests.filter((request) => {
      const timestamp =
        request.created_at ||
        request.createdAt ||
        request.start_time ||
        request.startTime;

      if (!timestamp) return false;

      const parsed = new Date(timestamp);
      if (Number.isNaN(parsed.getTime())) return false;

      return parsed.toISOString().slice(0, 10) === key;
    }).length;

    return {
      day: date.toLocaleDateString([], { weekday: "short" }),
      requests: count,
    };
  });
}

function App() {
  const [analytics, setAnalytics] = useState(null);
  const [resources, setResources] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState(null);

  const isAdmin = currentUser?.role === "ADMIN";
  const requestTrend = buildRequestTrend(requests);
  const resourceMix = [
    { name: "Available", value: analytics?.availableResources || 0 },
    { name: "Allocated", value: analytics?.allocatedResources || 0 },
  ].filter((item) => item.value > 0);
  const requestStatusData = [
    { name: "Pending", value: Number(analytics?.pendingRequests || 0) },
    { name: "Approved", value: Number(analytics?.approvedRequests || 0) },
    { name: "Rejected", value: Number(analytics?.rejectedRequests || 0) },
  ];

  const loadDashboard = async () => {
    try {
      const headers = getToken()
        ? authHeaders()
        : { "Content-Type": "application/json" };

      const [analyticsRes, resourcesRes, requestsRes] =
        await Promise.all([
          fetch(`${API}/analytics/overview`, { headers }),
          fetch(`${API}/resources`, { headers }),
          fetch(`${API}/requests`, { headers }),
        ]);

      const analyticsData = await analyticsRes.json();
      const resourcesData = await resourcesRes.json();
      const requestsData = await requestsRes.json();

      if (!analyticsRes.ok) {
        throw new Error(analyticsData.message || "Unable to load analytics");
      }

      setAnalytics(analyticsData.overview || null);
      setResources(resourcesData.resources || []);
      setRequests(requestsData.requests || []);
    } catch (error) {
      console.error("Dashboard loading error:", error);
      setAnalytics(null);
      setResources([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("nexus_user");
    const token = localStorage.getItem("nexus_token");

    if (savedUser && token) {
      try {
        setCurrentUser(normalizeUser(JSON.parse(savedUser)));
      } catch (error) {
        console.error("Invalid saved session:", error);
        localStorage.removeItem("nexus_user");
        localStorage.removeItem("nexus_token");
      }
    }

    setAuthChecking(false);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setLoading(true);
      loadDashboard();
    } else if (!authChecking) {
      setLoading(false);
    }
  }, [currentUser, authChecking]);

  const handleLogin = async (user, token) => {
    const normalized = normalizeUser(user);

    localStorage.setItem("nexus_token", token);
    localStorage.setItem("nexus_user", JSON.stringify(normalized));

    setCurrentUser(normalized);
    setActivePage("dashboard");
    setLoading(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_user");
    setCurrentUser(null);
    setAnalytics(null);
    setResources([]);
    setRequests([]);
    setActivePage("dashboard");
  };

  if (authChecking) {
    return (
      <div className="loading-screen">
        <div>
          <div className="loading-logo">N</div>
          <h2>NEXUS Allocate</h2>
          <p>Checking secure session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div>
          <div className="loading-logo">N</div>
          <h2>NEXUS Allocate</h2>
          <p>Loading resource command center...</p>
        </div>
      </div>
    );
  }

  if (activePage === "request") {
    return (
      <RequestPage
        resources={resources}
        userId={currentUser.id}
        currentUser={currentUser}
        onBack={() => setActivePage("dashboard")}
        onSuccess={loadDashboard}
      />
    );
  }

  if (activePage === "requests" && isAdmin) {
    return (
      <AdminRequestsPage
        requests={requests}
        onBack={() => setActivePage("dashboard")}
        onRefresh={loadDashboard}
      />
    );
  }

  if (activePage === "resources" && isAdmin) {
    return (
      <ResourcesPage
        resources={resources}
        onBack={() => setActivePage("dashboard")}
      />
    );
  }

  if (activePage === "people" && isAdmin) {
    return (
      <PeoplePage
        onBack={() => setActivePage("dashboard")}
      />
    );
  }

  if (activePage === "analytics" && isAdmin) {
    return (
      <AnalyticsPage
        analytics={analytics}
        onBack={() => setActivePage("dashboard")}
      />
    );
  }

  if (activePage === "settings" && isAdmin) {
    return (
      <SettingsPage
        currentUser={currentUser}
        onBack={() => setActivePage("dashboard")}
      />
    );
  }

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">N</div>

          <div>
            <h1>NEXUS</h1>
            <span>ALLOCATE</span>
          </div>
        </div>

        <div className="workspace">
          <span>WORKSPACE</span>
          <strong>Enterprise Operations</strong>
        </div>

        <nav>

          <button
            className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("dashboard")}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            className={`nav-item ${activePage === "request" ? "active" : ""}`}
            onClick={() => setActivePage("request")}
          >
            <Plus size={19} />
            New Request
          </button>

          {isAdmin && (
            <>
              <button
                className={`nav-item ${activePage === "resources" ? "active" : ""}`}
                onClick={() => setActivePage("resources")}
              >
                <Building2 size={19} />
                Resources
              </button>

              <button
                className={`nav-item ${activePage === "requests" ? "active" : ""}`}
                onClick={() => setActivePage("requests")}
              >
                <ClipboardList size={19} />
                Requests
                {analytics?.pendingRequests > 0 && (
                  <span className="nav-badge">{analytics.pendingRequests}</span>
                )}
              </button>

              <button
                className={`nav-item ${activePage === "people" ? "active" : ""}`}
                onClick={() => setActivePage("people")}
              >
                <Users size={19} />
                People
              </button>

              <button
                className={`nav-item ${activePage === "analytics" ? "active" : ""}`}
                onClick={() => setActivePage("analytics")}
              >
                <Activity size={19} />
                Analytics
              </button>
            </>
          )}

        </nav>

        <div className="sidebar-bottom">

          {isAdmin && (
            <button
              className={`nav-item ${activePage === "settings" ? "active" : ""}`}
              onClick={() => setActivePage("settings")}
            >
              <Settings size={19} />
              Settings
            </button>
          )}

          <div className="profile" style={{ position: "relative" }}>
            <div className="avatar">{currentUser.initials}</div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.title}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                fontSize: 11,
                padding: "5px 4px",
                opacity: 0.8,
              }}
            >
              Sign out
            </button>
          </div>

        </div>

      </aside>


      {/* MAIN */}
      <main className="main">

        <header className="topbar">

          <div>
            <p className="eyebrow">
              RESOURCE OPERATIONS
            </p>

            <h2>Command Center</h2>
          </div>

          <div className="top-actions">

            <div className="search">
              <Search size={17} />

              <input
                placeholder="Search resources..."
              />

              <kbd>⌘ K</kbd>
            </div>

            <button className="icon-button">
              <Bell size={19} />

              {analytics?.pendingRequests > 0 && (
                <span className="notification-dot" />
              )}
            </button>

            <button
              className="new-request"
              onClick={() => setActivePage("request")}
            >
              <Plus size={18} />
              New Request
            </button>

          </div>

        </header>


        {/* CONTENT */}
        <section className="content">

          <div className="welcome-row">

            <div>
              <h3>Resource overview</h3>

              <p>
                Monitor availability, allocations and demand
                across your organization.
              </p>
            </div>

            <div className="live-status">
              <span />
              Live system
            </div>

          </div>

          <section className="command-hero">
            <div className="command-hero-copy">
              <div className="hero-eyebrow"><span className="hero-pulse" /> OPERATIONS CONTROL PLANE</div>
              <h1>Know what is available.<br /><em>Allocate with confidence.</em></h1>
              <p>One workspace for resource demand, approvals, conflicts and utilization — built for fast operational decisions.</p>
              <div className="hero-actions">
                <button className="hero-primary" onClick={() => setActivePage("request")}><Plus size={16} /> Create allocation request</button>
                <div className="hero-meta"><ShieldCheck size={15} /> Real-time availability checks</div>
              </div>
            </div>
            <div className="hero-chart-card">
              <div className="hero-chart-top"><span>REQUEST STATUS</span><strong>Live</strong></div>
              <div className="hero-chart-value">{requests.length}<small> total requests</small></div>
              <ResponsiveContainer width="100%" height={112}>
                <BarChart data={requestStatusData} margin={{ top: 8, right: 0, left: -28, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "#aeb8d0" }} />
                  <YAxis hide allowDecimals={false} domain={[0, "dataMax + 1"]} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(15,23,42,.10)", fontSize: 11 }} />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} fill="#818cf8" maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>


          {/* KPI CARDS */}
          <div className="kpi-grid">

            <KpiCard
              title="Total Resources"
              value={analytics?.totalResources}
              icon={<Building2 size={20} />}
              subtitle="Registered resources"
            />

            <KpiCard
              title="Available"
              value={analytics?.availableResources}
              icon={<CheckCircle2 size={20} />}
              subtitle="Ready for allocation"
            />

            <KpiCard
              title="Allocated"
              value={analytics?.allocatedResources}
              icon={<CalendarDays size={20} />}
              subtitle="Currently allocated"
            />

            <KpiCard
              title="Utilization"
              value={`${analytics?.utilizationPercentage}%`}
              icon={<Activity size={20} />}
              subtitle="Resource utilization"
            />

          </div>


          {/* MIDDLE */}
          <div className="dashboard-grid">

            {/* REQUESTS */}
            <section className="panel">

              <div className="panel-header">

                <div>
                  <h3>Allocation requests</h3>
                  <p>Latest resource requests</p>
                </div>

                <button className="view-button">
                  View all
                </button>

              </div>


              <div className="request-stats">

                <Stat
                  label="Pending"
                  value={analytics?.pendingRequests}
                  icon={<Clock3 size={17} />}
                />

                <Stat
                  label="Approved"
                  value={analytics?.approvedRequests}
                  icon={<CheckCircle2 size={17} />}
                />

                <Stat
                  label="Rejected"
                  value={analytics?.rejectedRequests}
                  icon={<XCircle size={17} />}
                />

              </div>


              <div className="request-list">

                {requests.length === 0 ? (

                  <div className="empty-state">
                    <ClipboardList size={28} />
                    <p>No allocation requests yet.</p>
                  </div>

                ) : (

                  requests.slice(0, 5).map((request) => (

                    <div
                      className="request-row"
                      key={request.id}
                    >

                      <div className="request-avatar">
                        {request.requested_by
                          ?.split(" ")
                          .map((x) => x[0])
                          .join("")
                          .slice(0, 2)}
                      </div>

                      <div className="request-info">

                        <strong>
                          {request.requested_by}
                        </strong>

                        <span>
                          {request.resource_name}
                        </span>

                      </div>

                      <div className="request-time">

                        <strong>
                          {new Date(
                            request.start_time
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </strong>

                        <span>
                          {new Date(
                            request.start_time
                          ).toLocaleDateString()}
                        </span>

                      </div>

                      {isAdmin && (
                        <StatusBadge status={request.status} />
                      )}

                    </div>

                  ))

                )}

              </div>

            </section>


            {/* UTILIZATION */}
            <section className="panel utilization-panel">

              <div className="panel-header">

                <div>
                  <h3>Utilization</h3>
                  <p>Current resource utilization</p>
                </div>

              </div>

              <div className="utilization-ring">

                <div
                  className="ring"
                  style={{
                    "--progress": `${
                      analytics?.utilizationPercentage || 0
                    }%`,
                  }}
                >

                  <div className="ring-inner">

                    <strong>
                      {analytics?.utilizationPercentage}%
                    </strong>

                    <span>utilized</span>

                  </div>

                </div>

              </div>

              <div className="utilization-summary">

                <div>
                  <span>Allocated</span>
                  <strong>
                    {analytics?.allocatedResources}
                  </strong>
                </div>

                <div>
                  <span>Available</span>
                  <strong>
                    {analytics?.availableResources}
                  </strong>
                </div>

              </div>

            </section>

          </div>

          <div className="insight-grid">
            <section className="panel chart-panel">
              <div className="panel-header">
                <div>
                  <h3>Request status distribution</h3>
                  <p>Live requests from the allocation workflow</p>
                </div>
                <span className="chart-chip"><Activity size={13} /> Live</span>
              </div>
              <div className="large-chart">
                <ResponsiveContainer width="100%" height={230}>
                <BarChart data={requestStatusData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} domain={[0, "dataMax + 1"]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 12px 30px rgba(15,23,42,.10)", fontSize: 11 }} />
                  <Bar dataKey="value" name="Requests" radius={[7, 7, 0, 0]} fill="#6366f1" maxBarSize={58} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </section>

            <section className="panel chart-panel">
              <div className="panel-header">
                <div>
                  <h3>Resource mix</h3>
                  <p>Current allocation footprint</p>
                </div>
              </div>
              <div className="mix-layout">
                <div className="mix-chart">
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={resourceMix} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={78} paddingAngle={4} stroke="none">
                        {resourceMix.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? "#6366f1" : "#c7d2fe"} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mix-center"><strong>{analytics?.utilizationPercentage || 0}%</strong><span>utilized</span></div>
                </div>
                <div className="mix-legend">
                  <div><span className="legend-dot available" /><div><strong>{analytics?.availableResources || 0}</strong><small>Available</small></div></div>
                  <div><span className="legend-dot allocated" /><div><strong>{analytics?.allocatedResources || 0}</strong><small>Allocated</small></div></div>
                  <div className="mix-note"><CheckCircle2 size={14} /> Capacity is updated from the live resource registry.</div>
                </div>
              </div>
            </section>
          </div>


          {/* RESOURCE TABLE */}
          <section className="panel resources-panel">

            <div className="panel-header">

              <div>
                <h3>Resource registry</h3>

                <p>
                  Live inventory across your organization
                </p>
              </div>

              <button className="view-button">
                View resources
              </button>

            </div>

            <div className="table-wrapper">

              <table>

                <thead>

                  <tr>
                    <th>RESOURCE</th>
                    <th>TYPE</th>
                    <th>LOCATION</th>
                    <th>CAPACITY</th>
                    <th>STATUS</th>
                  </tr>

                </thead>

                <tbody>

                  {resources.slice(0, 6).map(
                    (resource) => (

                      <tr key={resource.id}>

                        <td>

                          <div className="resource-name">

                            <div className="resource-icon">
                              <Building2 size={17} />
                            </div>

                            <strong>
                              {resource.name}
                            </strong>

                          </div>

                        </td>

                        <td>{resource.type}</td>

                        <td>{resource.location}</td>

                        <td>{resource.capacity}</td>

                        <td>
                          <StatusBadge
                            status={resource.status}
                          />
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>

        </section>

      </main>

    </div>
  );
}


/* =========================
   LOGIN / REGISTER
========================= */

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const googleButtonRef = useRef(null);

  useEffect(() => {
    if (mode !== "login" || !googleButtonRef.current) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      console.error("VITE_GOOGLE_CLIENT_ID is missing from frontend .env");
      return;
    }

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;

      googleButtonRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: clientId,
        use_fedcm_for_button: true,
        callback: async (response) => {
          if (!response?.credential) {
            setMessage("Google sign-in did not return a credential.");
            return;
          }

          setMessage("");
          setBusy(true);

          try {
            const apiResponse = await fetch(`${API}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: response.credential }),
            });

            const data = await apiResponse.json();

            if (!apiResponse.ok || !data.success) {
              setMessage(data.message || "Google sign-in failed.");
              return;
            }

            if (!data.token || !data.user) {
              setMessage("Google sign-in succeeded but no user session was returned.");
              return;
            }

            onLogin(data.user, data.token);
          } catch (error) {
            console.error("Google authentication error:", error);
            setMessage(
              "Cannot connect to NEXUS API. Make sure the backend is running on port 5000."
            );
          } finally {
            setBusy(false);
          }
        },
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 365,
        text: "signin_with",
        shape: "rectangular",
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", initializeGoogle, { once: true });
      return () => existingScript.removeEventListener("load", initializeGoogle);
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => {
      setMessage("Unable to load Google Sign-In.");
    };
    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [mode]);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!email || !password || (mode === "register" && !name)) {
      setMessage("Please complete all required fields.");
      return;
    }

    setBusy(true);

    try {
      const endpoint = mode === "login" ? `${API}/auth/login` : `${API}/auth/register`;
      const body = mode === "login" ? { email, password } : { name, email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(data.message || "Authentication failed.");
        return;
      }

      if (!data.token || !data.user) {
        setMessage("Authentication succeeded but no user session was returned.");
        return;
      }

      onLogin(data.user, data.token);
    } catch (error) {
      console.error("Authentication error:", error);
      setMessage(
        "Cannot connect to NEXUS API. Make sure the backend is running on port 5000."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <div className="auth-layout">
        <section className="auth-hero">
          <div className="auth-brand-mark">N</div>
          <div className="auth-kicker">NEXUS / OPERATIONS</div>
          <h1>Allocate resources with clarity.</h1>
          <p>
            A centralized command center for availability, allocation requests,
            approvals and utilization across your organization.
          </p>

          <div className="auth-trust-row">
            <div><ShieldCheck size={16} /><span>Secure access</span></div>
            <div><Activity size={16} /><span>Live utilization</span></div>
            <div><UserCheck size={16} /><span>Role based</span></div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-header">
            <div>
              <span className="auth-mini-label">WORKSPACE ACCESS</span>
              <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
              <p>
                {mode === "login"
                  ? "Sign in to your NEXUS operations workspace."
                  : "Set up an employee account to start requesting resources."}
              </p>
            </div>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => { setMode("login"); setMessage(""); }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => { setMode("register"); setMessage(""); }}
            >
              Create account
            </button>
          </div>

          {mode === "login" && (
            <>
              <div className="google-button-wrap" ref={googleButtonRef} />
              <div className="auth-divider"><span>OR CONTINUE WITH EMAIL</span></div>
            </>
          )}

          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && (
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
              </label>
            )}

            <label>
              Work email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </label>

            {message && <div className="auth-error">{message}</div>}

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy
                ? "Authenticating..."
                : mode === "login"
                ? "Sign in to NEXUS"
                : "Create employee account"}
            </button>
          </form>

          <div className="auth-footer">
            <span><ShieldCheck size={14} /> Your workspace session is protected.</span>
            <small>New registrations receive Employee access.</small>
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================
   REQUEST PAGE
========================= */

function RequestPage({
  resources,
  userId,
  currentUser,
  onBack,
  onSuccess,
}) {

  const [resourceId, setResourceId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purpose, setPurpose] = useState("");

  const [checking, setChecking] = useState(false);
  const [availability, setAvailability] =
    useState(null);

  const [alternatives, setAlternatives] =
    useState([]);

  const [message, setMessage] = useState("");


  const checkAvailability = async () => {

    if (!resourceId || !startTime || !endTime) {
      setMessage(
        "Please select a resource and time."
      );
      return;
    }

    if (
      new Date(startTime) >=
      new Date(endTime)
    ) {
      setMessage(
        "End time must be after start time."
      );
      return;
    }

    setChecking(true);
    setMessage("");
    setAvailability(null);
    setAlternatives([]);

    try {

      const response = await fetch(
        `${API}/requests/check`,
        {
          method: "POST",

          headers: getToken()
            ? authHeaders()
            : { "Content-Type": "application/json" },

          body: JSON.stringify({
            resource_id: Number(resourceId),
            start_time: startTime,
            end_time: endTime,
          }),
        }
      );

      const data = await response.json();

      setAvailability(data);


      if (!data.available) {

        const alternativeResponse =
          await fetch(
            `${API}/requests/alternatives`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                resource_id:
                  Number(resourceId),

                start_time: startTime,
                end_time: endTime,

                required_capacity:
                  data.resource?.capacity || 1,
              }),
            }
          );


        const alternativeData =
          await alternativeResponse.json();


        setAlternatives(
          (alternativeData.alternatives || [])
            .filter(
              (resource) =>
                resource.available
            )
        );
      }

    } catch (error) {

      console.error(error);

      setMessage(
        "Unable to check availability."
      );

    } finally {

      setChecking(false);
    }
  };


  const selectAlternative = (resource) => {

    setResourceId(String(resource.id));

    setAvailability(null);

    setAlternatives([]);

    setMessage(
      `${resource.name} selected. Click Check Availability.`
    );
  };


  const submitRequest = async () => {

    if (
      !resourceId ||
      !startTime ||
      !endTime ||
      !purpose
    ) {
      setMessage(
        "Please complete all fields."
      );
      return;
    }


    try {

      const response = await fetch(
        `${API}/requests`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            user_id: userId,
            resource_id: Number(resourceId),
            start_time: startTime,
            end_time: endTime,
            purpose,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        setMessage(
          data.message ||
            "Request failed."
        );

        return;
      }


      setMessage(
        "✓ Request submitted successfully."
      );


      setResourceId("");
      setStartTime("");
      setEndTime("");
      setPurpose("");
      setAvailability(null);
      setAlternatives([]);


      if (onSuccess) {
        await onSuccess();
      }

    } catch (error) {

      console.error(error);

      setMessage(
        "Unable to submit request."
      );
    }
  };


  return (

    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            N
          </div>

          <div>
            <h1>NEXUS</h1>
            <span>ALLOCATE</span>
          </div>

        </div>


        <div className="workspace">

          <span>WORKSPACE</span>

          <strong>
            Enterprise Operations
          </strong>

        </div>


        <nav>

          <button
            className="nav-item"
            onClick={onBack}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button className="nav-item active">

            <ClipboardList size={19} />

            New Request

          </button>

        </nav>


        <div className="sidebar-bottom">

          <div className="profile">

            <div className="avatar">
              {currentUser?.initials || "U"}
            </div>

            <div>
              <strong>{currentUser?.name || "User"}</strong>
              <span>{currentUser?.title || "Employee"}</span>
            </div>

          </div>

        </div>

      </aside>


      {/* MAIN */}

      <main className="main">

        <header className="topbar">

          <div>

            <p className="eyebrow">
              RESOURCE OPERATIONS
            </p>

            <h2>
              Request a Resource
            </h2>

          </div>

        </header>


        <section className="content">

          <div className="request-page">

            <div className="request-heading">

              <button
                className="back-button"
                onClick={onBack}
              >
                <ArrowLeft size={13} />
                Back to dashboard
              </button>

              <h3>
                Create allocation request
              </h3>

              <p>
                Select a resource and time slot.
                NEXUS automatically checks
                availability and detects conflicts.
              </p>

            </div>


            <div className="request-layout">

              {/* FORM */}

              <div className="panel request-form">

                <div className="panel-header">

                  <div>

                    <h3>
                      Request details
                    </h3>

                    <p>
                      Tell us what you need
                    </p>

                  </div>

                </div>


                <div className="form-body">

                  <label>

                    Resource

                    <select
                      value={resourceId}
                      onChange={(e) => {
                        setResourceId(
                          e.target.value
                        );

                        setAvailability(null);
                        setAlternatives([]);
                        setMessage("");
                      }}
                    >

                      <option value="">
                        Select a resource
                      </option>

                      {resources.map((resource) => (

                        <option
                          key={resource.id}
                          value={resource.id}
                        >
                          {resource.name} —
                          Capacity{" "}
                          {resource.capacity}
                        </option>

                      ))}

                    </select>

                  </label>


                  <div className="form-row">

                    <label>

                      Start time

                      <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) =>
                          setStartTime(
                            e.target.value
                          )
                        }
                      />

                    </label>


                    <label>

                      End time

                      <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) =>
                          setEndTime(
                            e.target.value
                          )
                        }
                      />

                    </label>

                  </div>


                  <label>

                    Purpose

                    <textarea
                      rows="4"
                      placeholder="e.g. AI project team meeting"
                      value={purpose}
                      onChange={(e) =>
                        setPurpose(
                          e.target.value
                        )
                      }
                    />

                  </label>


                  <button
                    className="check-button"
                    onClick={
                      checkAvailability
                    }
                    disabled={checking}
                  >

                    {checking
                      ? "Checking..."
                      : "Check Availability"}

                  </button>

                </div>

              </div>


              {/* INTELLIGENCE */}

              <div className="panel intelligence-panel">

                <div className="panel-header">

                  <div>

                    <h3>
                      Smart allocation engine
                    </h3>

                    <p>
                      Real-time resource intelligence
                    </p>

                  </div>

                </div>


                <div className="intelligence-body">


                  {!availability && (

                    <div className="intelligence-empty">

                      <Activity size={30} />

                      <strong>
                        Waiting for availability check
                      </strong>

                      <span>
                        Select a resource and
                        time slot to activate
                        the allocation engine.
                      </span>

                    </div>

                  )}


                  {availability?.available && (

                    <div className="availability-success">

                      <CheckCircle2 size={34} />

                      <h3>
                        Resource Available
                      </h3>

                      <p>
                        The requested resource
                        is available for the
                        selected time period.
                      </p>

                      <button
                        className="submit-button"
                        onClick={
                          submitRequest
                        }
                      >
                        Submit Request
                      </button>

                    </div>

                  )}


                  {availability &&
                    !availability.available && (

                      <div className="availability-conflict">

                        <XCircle size={34} />

                        <h3>
                          Resource Conflict
                          Detected
                        </h3>

                        <p>
                          This resource is
                          already allocated
                          during the requested
                          time.
                        </p>


                        {alternatives.length >
                          0 && (

                          <div className="alternative-list">

                            <h4>
                              Smart Resource Match
                            </h4>

                            <p>
                              Available alternatives
                              for your requested time:
                            </p>


                            {alternatives
                              .slice(0, 3)
                              .map(
                                (resource) => (

                                  <div
                                    className="alternative-card"
                                    key={
                                      resource.id
                                    }
                                  >

                                    <div>

                                      <strong>
                                        {
                                          resource.name
                                        }
                                      </strong>

                                      <span>
                                        {
                                          resource.type
                                        }{" "}
                                        • Capacity{" "}
                                        {
                                          resource.capacity
                                        }
                                      </span>

                                    </div>


                                    <button
                                      onClick={() =>
                                        selectAlternative(
                                          resource
                                        )
                                      }
                                    >
                                      Select
                                    </button>

                                  </div>

                                )
                              )}

                          </div>

                        )}

                      </div>

                    )}


                  {message && (

                    <div className="form-message">
                      {message}
                    </div>

                  )}

                </div>

              </div>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}


/* =========================
   ADMIN REQUESTS PAGE
========================= */

function AdminRequestsPage({ requests, onBack, onRefresh }) {
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  const updateRequest = async (id, action) => {
    try {
      setBusyId(id);
      setMessage("");

      const response = await fetch(`${API}/requests/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        setMessage(data.message || `Unable to ${action} request.`);
        return;
      }

      setMessage(`Request #${id} ${action}d successfully.`);
      await onRefresh();
    } catch (error) {
      console.error(error);
      setMessage(`Unable to ${action} request.`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminPageShell title="Request Management" subtitle="Review and approve resource allocation requests." icon={<ClipboardList size={22} />} onBack={onBack}>
      {message && <div className="form-message" style={{ marginBottom: 16 }}>{message}</div>}
      <div className="panel resources-panel">
        <div className="panel-header">
          <div>
            <h3>Approval queue</h3>
            <p>Only administrators can approve or reject requests.</p>
          </div>
          <button className="view-button" onClick={onRefresh}><Clock3 size={15} /> Refresh</button>
        </div>

        {requests.length === 0 ? (
          <div className="empty-state"><ClipboardList size={28} /><p>No requests found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>REQUESTER</th>
                  <th>RESOURCE</th>
                  <th>DATE / TIME</th>
                  <th>PURPOSE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.requested_by || `User #${request.user_id}`}</td>
                    <td>{request.resource_name || `Resource #${request.resource_id}`}</td>
                    <td>
                      {new Date(request.start_time).toLocaleDateString()}<br />
                      {new Date(request.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td>{request.purpose || "—"}</td>
                    <td><StatusBadge status={request.status} /></td>
                    <td>
                      {String(request.status).toUpperCase() === "PENDING" ? (
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="submit-button"
                            style={{ padding: "8px 12px" }}
                            disabled={busyId === request.id}
                            onClick={() => updateRequest(request.id, "approve")}
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>
                          <button
                            className="check-button"
                            style={{ padding: "8px 12px" }}
                            disabled={busyId === request.id}
                            onClick={() => updateRequest(request.id, "reject")}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: 12 }}>Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPageShell>
  );
}

/* =========================
   ADMIN RESOURCES PAGE
========================= */

function ResourcesPage({ resources, onBack }) {
  return (
    <AdminPageShell title="Resources" subtitle="View the organization's complete resource inventory." icon={<Building2 size={22} />} onBack={onBack}>
      <div className="panel resources-panel">
        <div className="panel-header">
          <div><h3>Resource registry</h3><p>{resources.length} registered resources</p></div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>RESOURCE</th><th>TYPE</th><th>LOCATION</th><th>CAPACITY</th><th>STATUS</th></tr></thead>
            <tbody>
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td><strong>{resource.name}</strong></td>
                  <td>{resource.type}</td>
                  <td>{resource.location}</td>
                  <td>{resource.capacity}</td>
                  <td><StatusBadge status={resource.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}

/* =========================
   ADMIN PEOPLE PAGE
========================= */

function PeoplePage({ onBack }) {
  return (
    <AdminPageShell title="People" subtitle="Accounts and access roles in NEXUS Allocate." icon={<Users size={22} />} onBack={onBack}>
      <div className="panel resources-panel">
        <div className="panel-header"><div><h3>User accounts</h3><p>Role-based access overview</p></div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>USER</th><th>EMAIL</th><th>ROLE</th><th>PRIVILEGE</th></tr></thead>
            <tbody>
              {DEMO_USERS.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.name.toLowerCase().replace(/ /g, ".")}@nexus.com</td>
                  <td>{user.role}</td>
                  <td>{user.role === "ADMIN" ? "Full access + approval" : "Request resources"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}

/* =========================
   ADMIN ANALYTICS PAGE
========================= */

function AnalyticsPage({ analytics, onBack }) {
  return (
    <AdminPageShell title="Analytics" subtitle="Resource utilization and allocation metrics." icon={<Activity size={22} />} onBack={onBack}>
      <div className="kpi-grid">
        <KpiCard title="Total Resources" value={analytics?.totalResources} icon={<Building2 size={20} />} subtitle="Registered resources" />
        <KpiCard title="Available" value={analytics?.availableResources} icon={<CheckCircle2 size={20} />} subtitle="Ready for allocation" />
        <KpiCard title="Active Allocations" value={analytics?.activeAllocations} icon={<CalendarDays size={20} />} subtitle="Currently active" />
        <KpiCard title="Utilization" value={`${analytics?.utilizationPercentage}%`} icon={<Activity size={20} />} subtitle="Resource utilization" />
      </div>
      <div className="panel" style={{ marginTop: 20, padding: 24 }}>
        <h3>Request metrics</h3>
        <p>Pending: {analytics?.pendingRequests || 0} · Approved: {analytics?.approvedRequests || 0} · Rejected: {analytics?.rejectedRequests || 0}</p>
      </div>
    </AdminPageShell>
  );
}

/* =========================
   ADMIN SETTINGS PAGE
========================= */

function SettingsPage({ currentUser, onBack }) {
  return (
    <AdminPageShell title="Settings" subtitle="NEXUS Allocate access and workspace configuration." icon={<Settings size={22} />} onBack={onBack}>
      <div className="panel" style={{ padding: 24 }}>
        <h3>Access control</h3>
        <p style={{ marginTop: 8, color: "#64748b" }}>Signed in as <strong>{currentUser.name}</strong>. Administrators can review and approve allocation requests.</p>
        <div style={{ marginTop: 20, display: "grid", gap: 12 }}>
          <div style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 12 }}><strong>Admin</strong><br /><span>Full dashboard, resources, people, analytics, settings and request approval.</span></div>
          <div style={{ padding: 16, border: "1px solid #e2e8f0", borderRadius: 12 }}><strong>Other accounts</strong><br /><span>Can submit resource requests and check availability, but cannot approve or reject requests.</span></div>
        </div>
      </div>
    </AdminPageShell>
  );
}

function AdminPageShell({ title, subtitle, icon, onBack, children }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon">N</div><div><h1>NEXUS</h1><span>ALLOCATE</span></div></div>
        <div className="workspace"><span>WORKSPACE</span><strong>Enterprise Operations</strong></div>
        <nav>
          <button className="nav-item" onClick={onBack}><LayoutDashboard size={19} /> Dashboard</button>
          <button className="nav-item" onClick={() => window.location.reload()}><Database size={19} /> Command Center</button>
        </nav>
        <div className="sidebar-bottom"><div className="profile"><div className="avatar">AU</div><div><strong>Admin User</strong><span>Administrator</span></div></div></div>
      </aside>
      <main className="main">
        <header className="topbar"><div><p className="eyebrow">RESOURCE OPERATIONS</p><h2>{title}</h2></div></header>
        <section className="content">
          <div className="request-heading"><button className="back-button" onClick={onBack}><ArrowLeft size={13} /> Back to dashboard</button><h3>{title}</h3><p>{subtitle}</p></div>
          <div style={{ marginTop: 20 }}>{children}</div>
        </section>
      </main>
    </div>
  );
}

/* =========================
   KPI CARD
========================= */

function KpiCard({
  title,
  value,
  icon,
  subtitle,
}) {

  return (

    <div className="kpi-card">

      <div className="kpi-top">

        <div className="kpi-icon">
          {icon}
        </div>

        <span className="kpi-label">
          {title}
        </span>

      </div>


      <strong className="kpi-value">
        {value}
      </strong>


      <span className="kpi-subtitle">
        {subtitle}
      </span>

    </div>
  );
}


/* =========================
   STAT
========================= */

function Stat({
  label,
  value,
  icon,
}) {

  return (

    <div className="stat">

      <div className="stat-icon">
        {icon}
      </div>

      <div>

        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </div>
  );
}


/* =========================
   STATUS BADGE
========================= */

function StatusBadge({
  status,
}) {

  const normalized =
    status?.toUpperCase();

  let className =
    "status-badge";

  if (
    normalized === "AVAILABLE" ||
    normalized === "APPROVED"
  ) {
    className += " success";
  }

  if (
    normalized === "PENDING"
  ) {
    className += " warning";
  }

  if (
    normalized === "REJECTED" ||
    normalized === "UNAVAILABLE"
  ) {
    className += " danger";
  }

  if (
    normalized === "ALLOCATED"
  ) {
    className += " allocated";
  }

  return (

    <span className={className}>

      <span className="status-dot" />

      {status}

    </span>
  );
}


export default App;