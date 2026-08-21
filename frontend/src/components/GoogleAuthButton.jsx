import { useState, useEffect, useRef } from 'react';
import { LogOut, User as UserIcon, Sparkles, ChevronDown } from 'lucide-react';

const API_BASE_URL = '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '567988214066-b7bt7n2he8dfun71r47u70dq2er3rc77.apps.googleusercontent.com';

export default function GoogleAuthButton({ user, onLogin, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const googleBtnContainerRef = useRef(null);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    if (user) return;

    const initializeGoogleSignIn = () => {
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnContainerRef.current) {
          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'medium',
            type: 'standard',
            shape: 'pill',
            text: 'signin_with',
            logo_alignment: 'left',
          });
        }
      } catch (err) {
        console.warn('Google Identity initialization notice:', err);
      }
    };

    // Check if script is already loaded or retry briefly
    if (window.google && window.google.accounts) {
      initializeGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        if (window.google && window.google.accounts) {
          clearInterval(interval);
          initializeGoogleSignIn();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Sends & receives HTTP-only cookies
        body: JSON.stringify({ credential: response.credential }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Google authentication failed');
      }

      const data = await res.json();
      if (data.user) {
        onLogin(data.user, data.token);
      }
    } catch (err) {
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.warn('Logout notice:', err);
    } finally {
      setMenuOpen(false);
      onLogout();
    }
  };

  // If user is logged in: display user pill & dropdown menu
  if (user) {
    return (
      <div className="auth-user-wrapper" ref={menuRef}>
        <button
          type="button"
          className="auth-user-pill"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="User account menu"
        >
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="auth-avatar-img" />
          ) : (
            <div className="auth-avatar-fallback">
              {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
            </div>
          )}
          <span className="auth-user-name">{user.name}</span>
          <ChevronDown size={14} className={`auth-chevron ${menuOpen ? 'open' : ''}`} />
        </button>

        {menuOpen && (
          <div className="auth-dropdown-menu">
            <div className="auth-dropdown-header">
              <div className="auth-dropdown-name">{user.name}</div>
              <div className="auth-dropdown-email">{user.email}</div>
              <div className="auth-sync-badge">
                <Sparkles size={12} className="auth-sync-icon" />
                <span>Learning Journey Synced</span>
              </div>
            </div>
            <div className="auth-dropdown-divider" />
            <button
              type="button"
              className="auth-dropdown-item signout"
              onClick={handleSignOut}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // If anonymous: render Google Sign-In container with elegant fallback
  return (
    <div className="auth-container">
      <div ref={googleBtnContainerRef} className="google-btn-rendered" />
      {loading && <div className="auth-loading-indicator">Authenticating...</div>}
    </div>
  );
}
