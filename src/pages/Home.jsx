import Navbar from "../components/Navbar";
import "./Home.css";

function Home() {
  return (
    <div className="home-wrapper">

      <Navbar />

      {/* HERO SECTION */}
      <div className="full-section">
        <div className="hero-image">Image</div>
      </div>

      {/* WELCOME SECTION */}
      <div className="full-section welcome-text">
        <h2>WELCOME TO</h2>
        <h1>BudMap</h1>
      </div>

      {/* ABOUT US TITLE */}
      <div className="about-header">
        ABOUT US
      </div>

      {/* ABOUT CONTENT */}
      <div className="full-section">
        <div className="about-content"></div>
      </div>

      {/* CONTACT FOOTER */}
      <div className="contact-footer">
        CONTACT US AT:<br/>
        FOLLOW US:
      </div>

    </div>
  );
}

export default Home;
