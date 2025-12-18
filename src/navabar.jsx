import React from "react";
import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">

        <div className="navbar-logo">
          Azaad Safar
        </div>

        <nav className="navbar-links" aria-label="Main navigation">
          <NavLink to="/">Home</NavLink>
          <button className="nav-link">Explore</button>
          <button className="nav-link">Travel Partner</button>
          <button className="nav-link">Tourist Guides</button>
          <button className="nav-link">Contact</button>
        </nav>

        <div className="navbar-action">
          <button className="navbar-btn">Login</button>
        </div>

      </div>
    </header>
  );
}

export default Navbar;
