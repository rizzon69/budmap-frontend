import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <span className="logo">Logo</span>
      </div>

      <div className="navbar-right">
        <span className="menu-icon">☰</span>
      </div>
    </nav>
  );
}

export default Navbar;
