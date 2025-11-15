import React from 'react';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <a href="/">Logo</a>
        </div>
        <ul className="navbar-menu">
          <li className="navbar-item">
            <a href="/" className="navbar-link">Home</a>
          </li>
          <li className="navbar-item">
            <a href="/dashboard" className="navbar-link">Dashboard</a>
          </li>
          <li className="navbar-item">
            <a href="/profile" className="navbar-link">Profile</a>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;

