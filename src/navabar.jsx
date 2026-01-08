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
          <NavLink className="nav-link">Explore</NavLink>
          <NavLink className="nav-link">Travel Partner</NavLink>
          <NavLink className="nav-link">Tourist Guides</NavLink>
          <NavLink  className="nav-link">Contact</NavLink>
        </nav>

        <div className="navbar-action">
          <button className="navbar-btn">Login</button>
        </div>

      </div>
    </header>
  );
}

export default Navbar;
