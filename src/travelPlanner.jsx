import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./travelPlanner.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE;

const INTEREST_OPTIONS = ["Adventure", "Spiritual", "Luxury", "Budget"];
const LOCAL_USERS_KEY = "travel_partner_users_v1";
const LOCAL_SESSION_KEY = "travel_partner_session_v1";
const AUTH_EVENT = "travel-auth-changed";

const TAB_ITEMS = [
  { id: "discover", label: "Discover" },
  { id: "myTrips", label: "My Trips" },
  { id: "requests", label: "Requests" },
  { id: "hosting", label: "Hosting" },
  { id: "reports", label: "Reports" },
  { id: "profile", label: "Profile" },
];

const QUICK_FILTERS = [
  "Trek",
  "Weekend",
  "Backpacking",
  "Budget",
  "From Mumbai",
  "Verified Hosts",
];

const DESTINATION_IMAGES = {
  amritsar: "/images/Taj Mahal.jpg",
  "taj mahal": "/images/Taj Mahal.jpg",
  varanasi: "/images/Varansai.jpg",
  jaipur: "/images/jaipur.jpg",
  ladakh: "/images/Leh ladhak.jpg",
  leh: "/images/Leh ladhak.jpg",
  spiti: "/images/spiti valley.jpg",
  andaman: "/images/andaman islands.jpg",
  gateway: "/images/Gate way of india.JPG",
};

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const getStoredUsers = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getSessionUser = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY) || "null");
    if (!parsed?.email) return null;
    return {
      name: parsed.name || "Traveler",
      email: normalizeEmail(parsed.email),
      interest: parsed.interest || "Adventure",
    };
  } catch {
    return null;
  }
};

const mapGroup = (group) => ({
  id: group._id || group.id,
  hostName: group.hostName,
  hostEmail: group.hostEmail || "",
  hostInterest: group.hostInterest || "Adventure",
  hostRating: Number(group.hostRating || 4.8),
  hostVerified: Boolean(group.hostVerified),
  destination: group.destination,
  startDate: group.startDate,
  endDate: group.endDate,
  filledCount: Number(group.filledCount),
  totalCount: Number(group.totalCount),
  joinRequests: (group.joinRequests || []).map((request) => ({
    id: request._id || request.id,
    userName: request.userName,
    userEmail: request.userEmail,
    userInterest: request.userInterest,
    status: request.status || "pending",
  })),
});

const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return "Dates not set";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end - start) / 86400000));
  const sameMonth = start.getMonth() === end.getMonth();
  const startText = start.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const endText = end.toLocaleDateString("en-IN", { day: "numeric", month: sameMonth ? undefined : "short" });
  return `${startText} - ${endText} | ${days} Day${days > 1 ? "s" : ""}`;
};

const formatTripTiming = (startDate, endDate) => {
  if (!startDate || !endDate) return "Flexible";
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end - start) / 86400000));
  const diff = Math.floor((start - now) / 86400000);
  const timing = diff <= 2 ? "This Weekend" : diff <= 14 ? "Next 2 Weeks" : "Upcoming";
  return `${timing} | ${days} Day${days > 1 ? "s" : ""}`;
};

const formatFullDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const hashScore = (text) => Array.from(String(text || "")).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

const getHostTrust = (group) => {
  const score = hashScore(group.hostEmail || group.hostName);
  return {
    traveledWith: 8 + (score % 19),
    hostedTrips: 6 + (score % 34),
    lastTripAgo: 1 + (score % 4),
    responseMins: 5 + (score % 8),
  };
};

const getDestinationImage = (destination) => {
  const text = String(destination || "").toLowerCase();
  const match = Object.keys(DESTINATION_IMAGES).find((key) => text.includes(key));
  return match ? DESTINATION_IMAGES[match] : "/images/hero.jpg";
};

const getSeatTone = (ratio) => {
  if (ratio <= 0.5) return "cool";
  if (ratio <= 0.8) return "mid";
  return "hot";
};

const getSeatMessage = (filled, total) => {
  const seatsLeft = Math.max(total - filled, 0);
  if (seatsLeft <= 1) return "Only 1 seat left";
  if (seatsLeft <= 2) return `Only ${seatsLeft} seats left`;
  if (filled <= 1) return "New trip";
  if (filled >= total * 0.6) return "Filling fast";
  return `${seatsLeft} seats open`;
};

const getMessageTime = (timestamp) => {
  const date = new Date(timestamp || "");
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const getTabFromHash = () => {
  const hash = window.location.hash || "";
  const query = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : "";
  const params = new URLSearchParams(query);
  const tab = params.get("tab");
  if (TAB_ITEMS.some((item) => item.id === tab)) return tab;
  return "discover";
};

function TravelPlanner() {
  const [activeTab, setActiveTab] = useState("discover");
  const [authMode, setAuthMode] = useState("login");
  const [authMessage, setAuthMessage] = useState("");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    interest: "Adventure",
  });
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  const [groups, setGroups] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [destinationOptions, setDestinationOptions] = useState([]);

  const [heroQuery, setHeroQuery] = useState("");
  const [heroDates, setHeroDates] = useState("");
  const [heroGroupSize, setHeroGroupSize] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChips, setSelectedChips] = useState(new Set());

  const [toast, setToast] = useState(null);
  const [hostModalOpen, setHostModalOpen] = useState(false);
  const [hostForm, setHostForm] = useState({
    destination: "",
    totalCount: 5,
    filledCount: 3,
    startDate: "",
    endDate: "",
  });

  const [requestSubmittingByTrip, setRequestSubmittingByTrip] = useState({});
  const [deleteSubmittingByTrip, setDeleteSubmittingByTrip] = useState({});
  const [reviewSubmittingByRequest, setReviewSubmittingByRequest] = useState({});

  const [activeChatTripId, setActiveChatTripId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messagesByTrip, setMessagesByTrip] = useState({});
  const [unreadByTrip, setUnreadByTrip] = useState({});

  const socketRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const toastTimerRef = useRef(null);

  const refreshGroups = async (showLoading = false) => {
    if (!authenticatedUser) return;
    try {
      if (showLoading) setGroupLoading(true);
      const response = await fetch(`${API_BASE}/api/travel-groups`);
      if (!response.ok) return;
      const data = await response.json();
      setGroups((data || []).map(mapGroup));
    } catch {
      return;
    } finally {
      if (showLoading) setGroupLoading(false);
    }
  };

  useEffect(() => {
    const syncSession = () => {
      const session = getSessionUser();
      setAuthenticatedUser(session);
    };

    syncSession();
    setActiveTab(getTabFromHash());

    window.addEventListener("storage", syncSession);
    window.addEventListener(AUTH_EVENT, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(AUTH_EVENT, syncSession);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [toast]);

  useEffect(() => {
    if (!authenticatedUser) return undefined;
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("trip-message", (incoming) => {
      if (!incoming?.tripId) return;
      setMessagesByTrip((prev) => {
        const existing = prev[incoming.tripId] || [];
        const isDuplicate = incoming.messageId
          ? existing.some((msg) => msg.messageId === incoming.messageId)
          : false;
        if (isDuplicate) return prev;
        return {
          ...prev,
          [incoming.tripId]: [...existing, incoming],
        };
      });
      if (incoming.tripId !== activeChatTripId) {
        setUnreadByTrip((prev) => ({
          ...prev,
          [incoming.tripId]: (prev[incoming.tripId] || 0) + 1,
        }));
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authenticatedUser, activeChatTripId]);

  useEffect(() => {
    if (!authenticatedUser) return;
    refreshGroups(true);
  }, [authenticatedUser]);

  useEffect(() => {
    if (!authenticatedUser) return;
    fetch(`${API_BASE}/api/places`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const options = [...new Set((data || []).map((item) => item?.title).filter(Boolean))];
        setDestinationOptions(options.sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => undefined);
  }, [authenticatedUser]);

  useEffect(() => {
    const node = chatMessagesRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messagesByTrip, activeChatTripId]);

  const normalizedUserEmail = useMemo(
    () => normalizeEmail(authenticatedUser?.email),
    [authenticatedUser]
  );

  const myHostedGroups = useMemo(
    () =>
      groups.filter(
        (group) => normalizeEmail(group.hostEmail) === normalizedUserEmail
      ),
    [groups, normalizedUserEmail]
  );

  const myRequests = useMemo(() => {
    return groups
      .map((group) => {
        const mine = (group.joinRequests || []).find(
          (request) => normalizeEmail(request.userEmail) === normalizedUserEmail
        );
        if (!mine) return null;
        return { group, request: mine };
      })
      .filter(Boolean);
  }, [groups, normalizedUserEmail]);

  const myTrips = useMemo(() => {
    return groups.filter((group) => {
      const isHost = normalizeEmail(group.hostEmail) === normalizedUserEmail;
      const accepted = (group.joinRequests || []).some(
        (request) =>
          normalizeEmail(request.userEmail) === normalizedUserEmail &&
          request.status === "accepted"
      );
      return isHost || accepted;
    });
  }, [groups, normalizedUserEmail]);

  const hostedTripReports = useMemo(() => {
    return myHostedGroups.map((group) => {
      const accepted = (group.joinRequests || []).filter(
        (request) => request.status === "accepted"
      );
      const pending = (group.joinRequests || []).filter(
        (request) => request.status === "pending"
      );
      return {
        group,
        people: [
          {
            name: group.hostName,
            email: group.hostEmail || "Not shared",
            role: "Host",
            status: "accepted",
          },
          ...accepted.map((request) => ({
            name: request.userName,
            email: request.userEmail,
            role: "Traveler",
            status: "accepted",
          })),
          ...pending.map((request) => ({
            name: request.userName,
            email: request.userEmail,
            role: "Traveler",
            status: "pending",
          })),
        ],
      };
    });
  }, [myHostedGroups]);

  const pendingHostRequests = useMemo(
    () =>
      myHostedGroups.reduce(
        (count, group) =>
          count +
          (group.joinRequests || []).filter((request) => request.status === "pending")
            .length,
        0
      ),
    [myHostedGroups]
  );

  const filteredGroups = useMemo(() => {
    const query = (searchQuery || heroQuery).trim().toLowerCase();
    const sizeFilter = Number(heroGroupSize) || null;
    return groups
      .filter((group) => group.filledCount < group.totalCount)
      .filter((group) => {
        if (!query) return true;
        return group.destination.toLowerCase().includes(query);
      })
      .filter((group) => {
        if (selectedChips.has("Verified") && !group.hostVerified) return false;
        if (selectedChips.has("Girls Only")) return false;
        if (selectedChips.has("Age 18-25")) return true;
        return true;
      })
      .filter((group) => {
        if (!sizeFilter) return true;
        return group.totalCount <= sizeFilter;
      });
  }, [groups, heroGroupSize, heroQuery, searchQuery, selectedChips]);

  const activeMessages = activeChatTripId ? messagesByTrip[activeChatTripId] || [] : [];
  const activeGroup = groups.find((group) => group.id === activeChatTripId);

  const setToastMessage = (title, subtitle) => {
    setToast({ title, subtitle, id: `${Date.now()}-${Math.random()}` });
  };

  const replaceGroup = (updatedGroup) => {
    const mapped = mapGroup(updatedGroup);
    setGroups((prev) => {
      const exists = prev.some((group) => group.id === mapped.id);
      if (!exists) return [mapped, ...prev];
      return prev.map((group) => (group.id === mapped.id ? mapped : group));
    });
  };

  const getMyRequestStatus = (group) => {
    const mine = (group.joinRequests || []).find(
      (request) => normalizeEmail(request.userEmail) === normalizedUserEmail
    );
    return mine?.status || null;
  };

  const toggleFilterChip = (chip) => {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  };

  const handleAuthSubmit = (event) => {
    event.preventDefault();
    setAuthMessage("");

    const email = normalizeEmail(authForm.email);
    const password = String(authForm.password || "").trim();
    const name = String(authForm.name || "").trim();

    if (!email || !password) {
      setAuthMessage("Email and password are required.");
      return;
    }

    const users = getStoredUsers();

    if (authMode === "signup") {
      if (!name) {
        setAuthMessage("Name is required for sign up.");
        return;
      }
      if (users.some((user) => normalizeEmail(user.email) === email)) {
        setAuthMessage("Account already exists. Please login.");
        return;
      }
      const created = { name, email, password, interest: authForm.interest };
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify([...users, created]));
      const session = { name, email, interest: authForm.interest };
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
      window.dispatchEvent(new Event(AUTH_EVENT));
      setAuthenticatedUser(session);
      setToastMessage("Welcome aboard", `Account created for ${name}`);
      return;
    }

    const matched = users.find(
      (user) => normalizeEmail(user.email) === email && user.password === password
    );
    if (!matched) {
      setAuthMessage("Invalid credentials. Sign up first if needed.");
      return;
    }

    const session = {
      name: matched.name,
      email: normalizeEmail(matched.email),
      interest: matched.interest || "Adventure",
    };
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event(AUTH_EVENT));
    setAuthenticatedUser(session);
    setToastMessage("Logged in", `Welcome back ${session.name}`);
  };

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
    setAuthenticatedUser(null);
    setGroups([]);
    setMessagesByTrip({});
    setUnreadByTrip({});
    setActiveChatTripId("");
    setChatInput("");
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    const destination = hostForm.destination.trim();
    const totalCount = Number(hostForm.totalCount);
    const filledCount = Number(hostForm.filledCount);
    if (!destination || !hostForm.startDate || !hostForm.endDate) return;
    if (Number.isNaN(totalCount) || Number.isNaN(filledCount) || totalCount < 2) return;
    if (filledCount < 1 || filledCount > totalCount) return;

    try {
      const response = await fetch(`${API_BASE}/api/travel-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          startDate: hostForm.startDate,
          endDate: hostForm.endDate,
          totalCount,
          filledCount,
          hostName: authenticatedUser.name,
          hostEmail: authenticatedUser.email,
          hostInterest: authenticatedUser.interest,
          hostRating: 4.8,
          hostVerified: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Create group failed");
      replaceGroup(data);
      setHostModalOpen(false);
      setHostForm({
        destination: "",
        totalCount: 5,
        filledCount: 3,
        startDate: "",
        endDate: "",
      });
      setToastMessage("Trip created", `Hosting ${destination}`);
    } catch (error) {
      setToastMessage("Action failed", error.message);
    }
  };

  const handleRequestToJoin = async (tripId, destination) => {
    setRequestSubmittingByTrip((prev) => ({ ...prev, [tripId]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/travel-groups/${tripId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: authenticatedUser.name,
          userEmail: authenticatedUser.email,
          userInterest: authenticatedUser.interest,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Request failed");
      replaceGroup(data);
      await refreshGroups();
      setToastMessage("Request sent", `Waiting for host approval for ${destination}`);
    } catch (error) {
      setToastMessage("Request failed", error.message);
    } finally {
      setRequestSubmittingByTrip((prev) => ({ ...prev, [tripId]: false }));
    }
  };

  const handleReviewJoinRequest = async (tripId, requestId, action, destination) => {
    const key = `${requestId}:${action}`;
    setReviewSubmittingByRequest((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await fetch(
        `${API_BASE}/api/travel-groups/${tripId}/requests/${requestId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, hostEmail: authenticatedUser.email }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Could not review request");
      replaceGroup(data);
      await refreshGroups();
      if (action === "accept") setToastMessage("Request Accepted", `You approved ${destination}`);
      else setToastMessage("Request Declined", `You declined ${destination}`);
    } catch (error) {
      setToastMessage("Action failed", error.message);
    } finally {
      setReviewSubmittingByRequest((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDeleteTrip = async (tripId, destination) => {
    setDeleteSubmittingByTrip((prev) => ({ ...prev, [tripId]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/travel-groups/${tripId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostEmail: authenticatedUser.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Delete failed");
      setGroups((prev) => prev.filter((group) => group.id !== tripId));
      await refreshGroups();
      if (activeChatTripId === tripId) {
        setActiveChatTripId("");
        setChatInput("");
      }
      setToastMessage("Trip canceled", destination);
    } catch (error) {
      setToastMessage("Cancel failed", error.message);
    } finally {
      setDeleteSubmittingByTrip((prev) => ({ ...prev, [tripId]: false }));
    }
  };

  const handleOpenChat = async (tripId) => {
    setActiveChatTripId(tripId);
    setUnreadByTrip((prev) => ({ ...prev, [tripId]: 0 }));
    socketRef.current?.emit("join-trip-chat", { tripId });
    try {
      const response = await fetch(`${API_BASE}/api/travel-groups/${tripId}/messages`);
      if (!response.ok) return;
      const history = await response.json();
      setMessagesByTrip((prev) => ({ ...prev, [tripId]: history || [] }));
    } catch {
      return;
    }
  };

  const handleSendChat = (event) => {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || !activeChatTripId || !socketRef.current) return;
    socketRef.current.emit("trip-message", {
      tripId: activeChatTripId,
      message,
      userName: authenticatedUser?.name || "Traveler",
    });
    setChatInput("");
  };

  const renderStatusBadge = (status) => {
    if (status === "pending") return <span className="tp-badge waiting">Waiting Approval</span>;
    if (status === "accepted") return <span className="tp-badge accepted">Accepted</span>;
    if (status === "declined") return <span className="tp-badge declined">Trip Full</span>;
    return null;
  };

  const renderTripCard = (group) => {
    const ratio = group.totalCount > 0 ? group.filledCount / group.totalCount : 0;
    const progress = Math.min(100, Math.round(ratio * 100));
    const isHost = normalizeEmail(group.hostEmail) === normalizedUserEmail;
    const myStatus = getMyRequestStatus(group);
    const submitting = Boolean(requestSubmittingByTrip[group.id]);
    const trust = getHostTrust(group);
    const seatMessage = getSeatMessage(group.filledCount, group.totalCount);
    const socialProof = Math.max(group.filledCount - 1, 0);
    const unread = unreadByTrip[group.id] || 0;

    const actionLabel = submitting
      ? "Requesting..."
      : myStatus === "pending"
      ? "Request Sent"
      : myStatus === "declined"
      ? "Request Again"
      : "Join Trip";

    const disableJoin = submitting || myStatus === "pending" || myStatus === "accepted";

    return (
      <article key={group.id} className="tp-card">
        <div className="tp-card-image-wrap">
          <img src={getDestinationImage(group.destination)} alt={group.destination} />
        </div>
        <div className="tp-card-content">
          <div className="tp-card-top">
            <h3>{group.destination}</h3>
            <p>{formatTripTiming(group.startDate, group.endDate)} | {group.hostInterest}</p>
            <p className="tp-emotion-line">
              Traveling with {Math.max(group.filledCount, 1)} strangers who love adventures
            </p>
          </div>

          <div className="tp-card-host">
            <p>
              <span className="tp-online-dot" />
              {group.hostName} | Rating {group.hostRating.toFixed(1)} ({trust.hostedTrips} trips hosted)
            </p>
          </div>

          <div className="tp-critical-pills">
            <span>ID Verified</span>
            {group.hostVerified ? <span>Verified Host</span> : null}
            <span>Rating {group.hostRating.toFixed(1)}</span>
          </div>

          <div className="tp-inline-meta">
            <p>{trust.traveledWith} people traveled with this host</p>
            <p>Last trip {trust.lastTripAgo} weeks ago</p>
            <p>Responds within {trust.responseMins} mins</p>
            <p>{socialProof} travelers from Mumbai joined</p>
          </div>

          <div className="tp-progress-block">
            <div className="tp-progress-head">
              <strong>{seatMessage}</strong>
            </div>
            <div className={`tp-progress ${getSeatTone(ratio)}`} style={{ "--fill": `${progress}%` }}>
              <span />
            </div>
          </div>

          <div className="tp-card-actions">
            {isHost ? (
              <button
                type="button"
                className="tp-btn secondary"
                onClick={() => handleDeleteTrip(group.id, group.destination)}
                disabled={Boolean(deleteSubmittingByTrip[group.id])}
              >
                {deleteSubmittingByTrip[group.id] ? "Canceling..." : "Cancel Trip"}
              </button>
            ) : myStatus === "accepted" ? null : (
              <button
                type="button"
                className="tp-btn primary"
                onClick={() => handleRequestToJoin(group.id, group.destination)}
                disabled={disableJoin}
              >
                {actionLabel}
              </button>
            )}
            {renderStatusBadge(myStatus)}
            <button type="button" className="tp-chat-btn" onClick={() => handleOpenChat(group.id)}>
              <span className="tp-chat-icon" aria-hidden="true" />
              <span>Chat</span>
              {unread > 0 ? <span className="tp-unread">{unread}</span> : null}
            </button>
          </div>
        </div>
      </article>
    );
  };

  if (!authenticatedUser) {
    return (
      <section className="tp-auth">
        <div className="tp-auth-card">
          <p className="tp-kicker">Azaad Safar</p>
          <h1>{authMode === "login" ? "Login" : "Sign Up"}</h1>
          <div className="tp-auth-tabs">
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => {
                setAuthMode("login");
                setAuthMessage("");
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === "signup" ? "active" : ""}
              onClick={() => {
                setAuthMode("signup");
                setAuthMessage("");
              }}
            >
              Sign Up
            </button>
          </div>
          <form onSubmit={handleAuthSubmit} className="tp-auth-form">
            {authMode === "signup" ? (
              <input
                type="text"
                placeholder="Name"
                value={authForm.name}
                onChange={(event) =>
                  setAuthForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
            ) : null}
            <input
              type="email"
              placeholder="Email"
              value={authForm.email}
              onChange={(event) =>
                setAuthForm((prev) => ({ ...prev, email: event.target.value }))
              }
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(event) =>
                setAuthForm((prev) => ({ ...prev, password: event.target.value }))
              }
              required
            />
            {authMode === "signup" ? (
              <select
                value={authForm.interest}
                onChange={(event) =>
                  setAuthForm((prev) => ({ ...prev, interest: event.target.value }))
                }
              >
                {INTEREST_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            ) : null}
            {authMessage ? <p className="tp-auth-message">{authMessage}</p> : null}
            <button type="submit" className="tp-btn primary">
              {authMode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="tp-page">
      {toast ? (
        <aside className="tp-toast" key={toast.id}>
          <p>{toast.title}</p>
          <span>{toast.subtitle}</span>
        </aside>
      ) : null}
      <div className="tp-tabs">
        {TAB_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeTab ? "active" : ""}
            onClick={() => setActiveTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeTab === "discover" ? (
        <>
          <header className="tp-hero">
            <h2>Find People To Travel With</h2>
            <div className="tp-intent-box">
              <input
                type="text"
                placeholder="Search where to?"
                value={heroQuery}
                onChange={(event) => setHeroQuery(event.target.value)}
              />
              <input
                type="text"
                placeholder="Dates"
                value={heroDates}
                onChange={(event) => setHeroDates(event.target.value)}
              />
              <input
                type="number"
                placeholder="Group Size"
                value={heroGroupSize}
                onChange={(event) => setHeroGroupSize(event.target.value)}
                min={2}
              />
              <button type="button" className="tp-btn primary">
                Explore Trips
              </button>
            </div>
            <div className="tp-quick-filters">
              {QUICK_FILTERS.map((chip) => (
                <button key={chip} type="button" className="chip filter-chip">
                  {chip}
                </button>
              ))}
            </div>
          </header>

          <div className="tp-discovery-tools">
            <label className="tp-search">
              <span>Search</span>
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <div className="tp-filter-chips">
              {["Budget < 5k", "Age 18-25", "Girls Only", "From Pune", "Verified"].map(
                (chip) => (
                  <button
                    key={chip}
                    type="button"
                    className={selectedChips.has(chip) ? "active" : ""}
                    onClick={() => toggleFilterChip(chip)}
                  >
                    {chip}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="tp-feed">
            {groupLoading ? (
              <article className="tp-empty">Loading trips...</article>
            ) : filteredGroups.length ? (
              filteredGroups.map(renderTripCard)
            ) : (
              <article className="tp-empty">No trips matched your filters.</article>
            )}
          </div>
        </>
      ) : null}

      {activeTab === "myTrips" ? (
        <div className="tp-panel">
          <h3>My Trips</h3>
          {myTrips.length ? myTrips.map(renderTripCard) : <p>No joined trips yet.</p>}
        </div>
      ) : null}

      {activeTab === "requests" ? (
        <div className="tp-panel">
          <h3>Requests</h3>
          {myRequests.length ? (
            <div className="tp-request-list">
              {myRequests.map(({ group, request }) => (
                <article key={`${group.id}-${request.id}`} className="tp-request-row">
                  <div>
                    <strong>{group.destination}</strong>
                    <p>{formatDateRange(group.startDate, group.endDate)}</p>
                  </div>
                  {renderStatusBadge(request.status)}
                </article>
              ))}
            </div>
          ) : (
            <p>No requests made yet.</p>
          )}
        </div>
      ) : null}

      {activeTab === "hosting" ? (
        <div className="tp-panel">
          <div className="tp-panel-head">
            <h3>Hosting</h3>
            <div className="tp-panel-actions">
              <span className="tp-badge waiting">{pendingHostRequests} pending requests</span>
              <button
                type="button"
                className="tp-btn primary"
                onClick={() => setHostModalOpen(true)}
              >
                Host a Trip
              </button>
              <button type="button" className="tp-btn secondary" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
          {myHostedGroups.length ? (
            myHostedGroups.map((group) => {
              const pending = (group.joinRequests || []).filter(
                (request) => request.status === "pending"
              );
              const accepted = (group.joinRequests || []).filter(
                (request) => request.status === "accepted"
              );
              const peopleGoing = [
                {
                  name: group.hostName,
                  email: group.hostEmail || "Not shared",
                  role: "Host",
                },
                ...accepted.map((request) => ({
                  name: request.userName,
                  email: request.userEmail,
                  role: "Traveler",
                })),
              ];
              return (
                <article key={group.id} className="tp-host-card">
                  <div className="tp-host-summary">
                    <strong>{group.destination}</strong>
                    <p>{formatDateRange(group.startDate, group.endDate)}</p>
                    <p className="tp-host-date-line">
                      From {formatFullDate(group.startDate)} to {formatFullDate(group.endDate)}
                    </p>
                    <span>{group.filledCount}/{group.totalCount} seats filled</span>
                  </div>
                  <div className="tp-host-people">
                    <h4>People Going ({peopleGoing.length})</h4>
                    <div className="tp-host-people-list">
                      {peopleGoing.map((person, index) => (
                        <div key={`${person.email}-${index}`} className="tp-host-person-row">
                          <div>
                            <strong>{person.name}</strong>
                            <p>{person.email}</p>
                          </div>
                          <span>{person.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="tp-btn secondary"
                    onClick={() => handleDeleteTrip(group.id, group.destination)}
                    disabled={Boolean(deleteSubmittingByTrip[group.id])}
                  >
                    {deleteSubmittingByTrip[group.id] ? "Canceling..." : "Cancel Trip"}
                  </button>
                  <div className="tp-host-requests">
                    {pending.length ? (
                      pending.map((request) => {
                        const acceptKey = `${request.id}:accept`;
                        const declineKey = `${request.id}:decline`;
                        const busy =
                          reviewSubmittingByRequest[acceptKey] ||
                          reviewSubmittingByRequest[declineKey];
                        return (
                          <div key={request.id} className="tp-host-request-row">
                            <div>
                              <strong>{request.userName}</strong>
                              <p>
                                {request.userEmail} | {request.userInterest}
                              </p>
                            </div>
                            <div className="tp-host-request-actions">
                              <button
                                type="button"
                                className="tp-btn primary"
                                disabled={busy}
                                onClick={() =>
                                  handleReviewJoinRequest(
                                    group.id,
                                    request.id,
                                    "accept",
                                    group.destination
                                  )
                                }
                              >
                                {reviewSubmittingByRequest[acceptKey] ? "Accepting..." : "Accept"}
                              </button>
                              <button
                                type="button"
                                className="tp-btn secondary"
                                disabled={busy}
                                onClick={() =>
                                  handleReviewJoinRequest(
                                    group.id,
                                    request.id,
                                    "decline",
                                    group.destination
                                  )
                                }
                              >
                                {reviewSubmittingByRequest[declineKey]
                                  ? "Declining..."
                                  : "Decline"}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="tp-muted">No pending requests on this trip.</p>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <p>You are not hosting trips yet.</p>
          )}
        </div>
      ) : null}
      {hostModalOpen ? (
        <div
          className="tp-modal-overlay"
          role="presentation"
          onClick={() => setHostModalOpen(false)}
        >
          <form
            className="tp-modal"
            onSubmit={handleCreateGroup}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tp-modal-head">
              <h3>Host a Trip</h3>
              <button type="button" onClick={() => setHostModalOpen(false)}>
                Close
              </button>
            </div>
            <label>
              Destination
              <select
                value={hostForm.destination}
                onChange={(event) =>
                  setHostForm((prev) => ({ ...prev, destination: event.target.value }))
                }
                required
              >
                <option value="">Choose destination</option>
                {destinationOptions.map((destination) => (
                  <option key={destination} value={destination}>
                    {destination}
                  </option>
                ))}
              </select>
            </label>
            <div className="tp-modal-grid">
              <label>
                Group Total
                <input
                  type="number"
                  min={2}
                  value={hostForm.totalCount}
                  onChange={(event) =>
                    setHostForm((prev) => ({
                      ...prev,
                      totalCount: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Filled Now
                <input
                  type="number"
                  min={1}
                  max={hostForm.totalCount}
                  value={hostForm.filledCount}
                  onChange={(event) =>
                    setHostForm((prev) => ({
                      ...prev,
                      filledCount: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>
            <div className="tp-modal-grid">
              <label>
                Start Date
                <input
                  type="date"
                  value={hostForm.startDate}
                  onChange={(event) =>
                    setHostForm((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                End Date
                <input
                  type="date"
                  value={hostForm.endDate}
                  min={hostForm.startDate || undefined}
                  onChange={(event) =>
                    setHostForm((prev) => ({ ...prev, endDate: event.target.value }))
                  }
                  required
                />
              </label>
            </div>
            <button type="submit" className="tp-btn primary">
              Create Group
            </button>
          </form>
        </div>
      ) : null}

      {activeTab === "profile" ? (
        <div className="tp-panel">
          <h3>Profile</h3>
          <article className="tp-host-card">
            <div className="tp-host-summary">
              <strong>{authenticatedUser.name}</strong>
              <p>{authenticatedUser.email}</p>
              <span>Primary interest: {authenticatedUser.interest || "Adventure"}</span>
            </div>
            <div className="tp-critical-pills">
              <span>{myTrips.length} active trips</span>
              <span>{myRequests.length} total requests</span>
              <span>{myHostedGroups.length} hosted groups</span>
            </div>
            <button type="button" className="tp-btn secondary" onClick={handleLogout}>
              Logout
            </button>
          </article>
        </div>
      ) : null}

      {activeTab === "reports" ? (
        <div className="tp-panel">
          <h3>Trip Reports</h3>
          {hostedTripReports.length ? (
            hostedTripReports.map((report) => (
              <article key={report.group.id} className="tp-report-card">
                <header>
                  <h4>{report.group.destination}</h4>
                  <p>{formatDateRange(report.group.startDate, report.group.endDate)}</p>
                </header>
                <p className="tp-report-summary">
                  {report.group.filledCount}/{report.group.totalCount} seats filled
                </p>
                <div className="tp-report-table">
                  <div className="tp-report-row head">
                    <span>Name</span>
                    <span>Email</span>
                    <span>Role</span>
                    <span>Status</span>
                  </div>
                  {report.people.map((person, index) => (
                    <div key={`${person.email}-${index}`} className="tp-report-row">
                      <span>{person.name}</span>
                      <span>{person.email}</span>
                      <span>{person.role}</span>
                      <span>{person.status}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))
          ) : (
            <p>No hosted trip reports yet.</p>
          )}
        </div>
      ) : null}

      <aside className={`tp-chat ${activeChatTripId ? "open" : ""}`}>
        <header>
          <h4>{activeGroup ? `${activeGroup.destination} Chat` : "Trip Chat"}</h4>
          <button type="button" onClick={() => setActiveChatTripId("")}>
            Close
          </button>
        </header>
        <div className="tp-chat-messages" ref={chatMessagesRef}>
          {activeMessages.length ? (
            activeMessages.map((message) => {
              const mine =
                normalizeEmail(message.userEmail) === normalizedUserEmail ||
                message.userName === authenticatedUser?.name;
              return (
                <article
                  key={`${message.timestamp}-${message.messageId || "local"}`}
                  className={mine ? "mine" : ""}
                >
                  <strong>{message.userName}</strong>
                  <p>{message.message}</p>
                  <small>{getMessageTime(message.timestamp)}</small>
                </article>
              );
            })
          ) : (
            <p className="tp-muted">No messages yet.</p>
          )}
        </div>
        <form onSubmit={handleSendChat}>
          <input
            type="text"
            placeholder="Write a message"
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            disabled={!activeChatTripId}
          />
          <button type="submit" disabled={!activeChatTripId || !chatInput.trim()}>
            Send
          </button>
        </form>
      </aside>
    </section>
  );
}

export default TravelPlanner;

