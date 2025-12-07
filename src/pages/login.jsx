import "./Login.css";

function Login() {
  return (
    <div className="login-wrapper">

      <div className="login-box">

        {/* HEADER */}
        <div className="login-header">
          <span className="left-text">CONTACT US</span>
          <span className="center-text">BUDMAP</span>
        </div>

        {/* LOGIN FORM */}
        <div className="form-section">

          <h3>Login account</h3>

          <label>NAME</label>
          <input type="text" />

          <label>EMAIL</label>
          <input type="email" />

          <label>Password</label>
          <input type="password" />

          <button className="login-btn">Log in</button>

          {/* LINKS */}
          <p className="links">
            <a href="/register">create a new account?</a><br />
            <a href="/forgot">Forgot password?</a>
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;
