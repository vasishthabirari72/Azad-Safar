import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./navabar.css";

const LOCAL_SESSION_KEY = "travel_partner_session_v1";
const AUTH_EVENT = "travel-auth-changed";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const getSessionUser = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY) || "null");
    if (!parsed?.email) return null;
    return {
      name: parsed.name || "Traveler",
      email: normalizeEmail(parsed.email),
      interest: parsed.interest || "Adventure",
      // role defaults to "traveler" for old sessions that predate the role field
      role: parsed.role || "traveler",
      id: parsed.id || null,
      guideProfileId: parsed.guideProfileId || null,
      guideStatus: parsed.guideStatus || null,
    };
  } catch {
    return null;
  }
};

const initials = (name) =>
  String(name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function Navbar() {
  const navClassName = ({ isActive }) => (isActive ? "active" : undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const syncSession = () => setUser(getSessionUser());
    syncSession();
    window.addEventListener("storage", syncSession);
    window.addEventListener(AUTH_EVENT, syncSession);
    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(AUTH_EVENT, syncSession);
    };
  }, []);

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  const avatarText = useMemo(() => initials(user?.name), [user]);

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
    setMenuOpen(false);
  };

  // FIX: TravelPlanner reads tab from searchParams (?tab=), so navigate with search, not hash
  const goToTab = (tab) => {
    setMenuOpen(false);
    navigate(`/travel-partner?tab=${tab}`);
  };

  return (
    <header className="premium-navbar">
      <div className="premium-navbar-inner">
        <Link to="/" className="premium-logo">
          Azaad Safar
        </Link>

        <nav className="premium-links" aria-label="Main navigation">
          <NavLink to="/" end className={navClassName}>
            Home
          </NavLink>
          <NavLink to="/explore" className={navClassName}>
            Explore
          </NavLink>
          <NavLink to="/travel-partner" className={navClassName}>
            Travel Partner
          </NavLink>
          <NavLink to="/guides" className={navClassName}>
            Tourist Guides
          </NavLink>
          <NavLink to="/contact" className={navClassName}>
            Contact
          </NavLink>
        </nav>

        <div className="premium-actions" ref={dropdownRef}>
          {user ? (
            <>
              {user.role === "guide" ? (
                <Link to="/guide-dashboard" className="premium-host-cta">
                  My Dashboard
                </Link>
              ) : (
                <Link to="/travel-partner" className="premium-host-cta">
                  Host a Trip
                </Link>
              )}
              <button
                type="button"
                className="premium-avatar"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {avatarText || "U"}
              </button>
              {menuOpen ? (
                <div className="premium-dropdown">
                  {user.role === "guide" ? (
                    <>
                      <button type="button" onClick={() => { navigate("/guide-dashboard"); setMenuOpen(false); }}>
                        Dashboard
                      </button>
                      <button type="button" onClick={() => { navigate("/guides"); setMenuOpen(false); }}>
                        Browse Guides
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => goToTab("myTrips")}>
                        My Trips
                      </button>
                      <button type="button" onClick={() => goToTab("requests")}>
                        Requests
                      </button>
                      <button type="button" onClick={() => goToTab("hosting")}>
                        Profile
                      </button>
                    </>
                  )}
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <NavLink to="/auth" className="premium-login">
              Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;