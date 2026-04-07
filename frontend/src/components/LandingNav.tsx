import { Link } from 'react-router-dom';

const Nav = () => {
  return (
    <nav className="nav">
      <Link to="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="logo-word">PETAL</span>
        <span className="logo-sub">MULTI-AGENT SYSTEM</span>
      </Link>
      <div className="nav-links">
        <Link to="/features" className="nav-link">Features</Link>
        <Link to="/how-it-works" className="nav-link">How It Works</Link>
        <Link to="/signup" className="nav-link cta">Get Started</Link>
      </div>
    </nav>
  );
};

export default Nav;