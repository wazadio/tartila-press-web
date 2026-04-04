import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AuthCallback() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const err = params.get('error');

    if (err) {
      setError('Google sign-in was cancelled or failed. Please try again.');
      setTimeout(() => navigate('/login'), 2500);
      return;
    }

    if (!token) {
      navigate('/login');
      return;
    }

    loginWithToken(token)
      .then(() => navigate('/'))
      .catch(() => {
        setError('Failed to sign in. Please try again.');
        setTimeout(() => navigate('/login'), 2500);
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
      {error ? (
        <p style={{ color: 'var(--color-red)' }}>{error}</p>
      ) : (
        <p style={{ color: 'var(--color-text-muted)' }}>Signing you in…</p>
      )}
    </div>
  );
}

export default AuthCallback;
