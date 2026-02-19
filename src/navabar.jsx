import React from "react";
import { NavLink } from "react-router-dom";

function Navbar() {
  const navClassName = ({ isActive }) => (isActive ? "active" : undefined);

  return (
    <header className="navbar">
      <div className="navbar-container">

        <div className="navbar-logo">
          Azaad Safar
        </div>

        <nav className="navbar-links" aria-label="Main navigation">
          <NavLink to="/" end className={navClassName}>Home</NavLink>
          <NavLink to="/explore" className={navClassName}>Explore</NavLink>
          <NavLink to="/travel-planner" className={navClassName}>Travel Planner</NavLink>
          <a href="#">Travel Partner</a>
          <a href="#">Tourist Guides</a>
          <a href="#">Contact</a>
        </nav>

        <div className="navbar-action">
          <button className="navbar-btn">Login</button>
        </div>

      </div>
    </header>
  );
}

export default Navbar;
