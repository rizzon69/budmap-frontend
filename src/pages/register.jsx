import "./Register.css";

function Register() {
  return (
    <div className="register-wrapper">

      <div className="register-box">

        {/* HEADER */}
        <div className="register-header">
          <span className="left-text">CONTACT US</span>
          <span className="center-text">BUDMAP</span>
        </div>

        {/* FORM SECTION */}
        <div className="form-section">

          <h3>Create an account</h3>

          {/* FIRST NAME + LAST NAME */}
          <div className="row">
            <div className="column">
              <label>First name</label>
              <input type="text" />
            </div>

            <div className="column">
              <label>Last name</label>
              <input type="text" />
            </div>
          </div>

          {/* EMAIL + ORGANIZATION NAME */}
          <div className="row">
            <div className="column">
              <label>EMAIL</label>
              <input type="email" />
            </div>

            <div className="column">
              <label>Organization name</label>
              <input type="text" />
            </div>
          </div>

          {/* PASSWORD + ORGANIZATION TYPE */}
          <div className="row">
            <div className="column">
              <label>Password</label>
              <input type="password" />
            </div>

            <div className="column">
              <label>organization type</label>
              <input type="text" />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button className="create-btn">create an account</button>

          {/* LINKS */}
          <p className="links">
            already have an accout? <a href="/login">Login</a><br />
            <a href="#">Forgot password?</a>
          </p>

        </div>

      </div>

    </div>
  );
}

export default Register;
