import "./ChangePassword.css";

function ChangePassword() {
  return (
    <div className="change-wrapper">

      <div className="change-box">

        <h2 className="title">change password</h2>

        <label>new password</label>
        <input type="password" />

        <label>confirm password</label>
        <input type="password" />

        <button className="confirm-btn">confirm</button>

      </div>

    </div>
  );
}

export default ChangePassword;
