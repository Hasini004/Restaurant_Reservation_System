import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className={`navbar ${isAdmin ? 'navbar-admin' : ''}`}>
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          Bella Tavola {isAdmin && <span className="badge">Admin</span>}
        </Link>

        <nav className="navbar-links">
          {isAuthenticated ? (
            <>
              <span className="navbar-user">Hi, {user.name}</span>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
