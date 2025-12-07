import "./ForgotPassword.css";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const navigate = useNavigate();

  // When the user clicks "send code"
  const handleSendCode = () => {
    navigate("/otp"); // Go to OTP page
  };

  return (
    <div className="forgot-wrapper">

      <div className="forgot-box">

        <h2 className="title">forgot password?</h2>

        <label>NAME</label>
        <input type="text" />

        <label>EMAIL</label>
        <input type="email" />

        <button className="send-btn" onClick={handleSendCode}>
          send code
        </button>

      </div>

    </div>
  );
}

export default ForgotPassword;
