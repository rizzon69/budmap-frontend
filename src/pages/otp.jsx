import "./OTP.css";

function OTP() {
  return (
    <div className="otp-wrapper">

      <div className="otp-box">

        {/* PAGE TITLE */}
        <h2 className="otp-title">Verify OTP</h2>
        <p className="otp-subtitle">Enter the 6-digit code sent to your email</p>

        {/* OTP INPUT BOXES */}
        <div className="otp-input-container">
          <input maxLength="1" type="text" />
          <input maxLength="1" type="text" />
          <input maxLength="1" type="text" />
          <input maxLength="1" type="text" />
          <input maxLength="1" type="text" />
          <input maxLength="1" type="text" />
        </div>

        {/* RESEND */}
        <p className="resend-text">
          Didn't receive code? <a href="#">Resend OTP</a>
        </p>

        {/* VERIFY BUTTON */}
        <button className="verify-btn">Verify OTP</button>

      </div>

    </div>
  );
}

export default OTP;
