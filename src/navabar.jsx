import React from "react";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">

        
        <div className="navbar-logo">
          Azaad Safar
        </div>

       
        <nav className="navbar-links" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/explore">Explore</a>
          <a href="/partners">Travel Partner</a>
          <a href="/guides">Tourist Guides</a>
          <a href="/contact">Contact</a>
        </nav>

        
        <div className="navbar-action">
          <button className="navbar-btn">Login</button>
        </div>

      </div>
    </header>
  );
}

export default Navbar;
