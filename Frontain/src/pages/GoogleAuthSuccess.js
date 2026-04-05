import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleAuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const user = params.get('user');

    if (token && user) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(user));
        localStorage.setItem('budmap_token', token);
        localStorage.setItem('budmap_user', JSON.stringify(parsedUser));
        // Force a full reload so AuthContext picks up the new token
        window.location.href = '/dashboard';
      } catch (err) {
        navigate('/login?error=google_failed');
      }
    } else {
      navigate('/login?error=google_failed');
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '16px',
      fontFamily: 'sans-serif',
      color: '#555'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e0e0e0',
        borderTop: '3px solid #4285F4',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ margin: 0, fontSize: '15px' }}>Signing you in with Google...</p>
    </div>
  );
};

export default GoogleAuthSuccess;
