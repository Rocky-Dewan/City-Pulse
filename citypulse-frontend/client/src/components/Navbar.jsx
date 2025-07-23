import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <nav style={styles.nav}>
      <h1 style={styles.logo}>CityPulse</h1>
      <div>
        <Link to="/" style={styles.link}>Home</Link>
        {isAuthenticated && <Link to="/create" style={styles.link}>Report</Link>}
        {!isAuthenticated ? (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/signup" style={styles.link}>Signup</Link>
          </>
        ) : (
          <button onClick={handleLogout} style={styles.logout}>Logout</button>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    backgroundColor: '#333',
    color: 'white',
    alignItems: 'center',
  },
  logo: {
    margin: 0,
  },
  link: {
    margin: '0 10px',
    color: 'white',
    textDecoration: 'none',
  },
  logout: {
    marginLeft: '10px',
    padding: '6px 12px',
    cursor: 'pointer',
    backgroundColor: '#f44336',
    border: 'none',
    color: 'white',
    borderRadius: '4px',
  }
};

export default Navbar;
