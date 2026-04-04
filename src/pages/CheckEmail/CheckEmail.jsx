import { useLocation, Link } from 'react-router-dom';
import '../Login/Login.css';
import './CheckEmail.css';

function CheckEmail() {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="auth-page">
      <div className="auth-card check-email-card">
        <div className="check-email__icon">📬</div>
        <div className="auth-card__header">
          <p className="auth-card__eyebrow">Tartila</p>
          <h1>Check your email</h1>
          <p>
            We sent a verification link to <strong>{email}</strong>.
            Click the link in the email to activate your account.
          </p>
        </div>
        <div className="check-email__tips">
          <p>Didn't receive it?</p>
          <ul>
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email</li>
          </ul>
        </div>
        <p className="auth-footer">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default CheckEmail;
