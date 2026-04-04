import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../Login/Login.css';
import './VerifyEmail.css';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('Invalid verification link.');
      return;
    }

    authApi.verify(token)
      .then(async (data) => {
        await loginWithToken(data.access_token);
        setStatus('success');
        setTimeout(() => navigate('/'), 2000);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.message || 'Verification failed. The link may have expired.');
      });
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card verify-card">
        {status === 'verifying' && (
          <>
            <div className="verify-icon verify-icon--spin">⏳</div>
            <h1>Verifying your email…</h1>
            <p>Please wait a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="verify-icon">✅</div>
            <h1>Email verified!</h1>
            <p>Your account is now active. Redirecting you to the homepage…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="verify-icon">❌</div>
            <h1>Verification failed</h1>
            <p>{errorMsg}</p>
            <Link to="/register" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Register again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
