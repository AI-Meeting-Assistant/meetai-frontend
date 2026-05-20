import { useState, useRef, useEffect } from "react";
import Logo from "../../assets/react.svg";
import { useAuth } from "../../contexts/AuthContext";

export function AppHeader() {
  const [isDropDownOpen, setIsDropDownOpen] = useState<boolean>(false);
  const { logout, user } = useAuth();
  const roleLabel = user?.role === 'MODERATOR' ? 'Moderator' : user?.role === 'VIEWER' ? 'Viewer' : null;

  const handleLogout = () => {
    const loginPath = user?.role === 'VIEWER' ? '/viewer/login' : '/login';
    logout();
    window.location.hash = `#${loginPath}`;
  };
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropDownOpen(false);
      }
    }

    if (isDropDownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropDownOpen]);

  console.log("Logo path:", Logo);

  return (
    <div className="app-header" ref={dropdownRef}>
      {roleLabel && (
        <span
          className="status-label"
          style={{ marginRight: 'auto', marginLeft: 'var(--space-4)' }}
        >
          {roleLabel}
        </span>
      )}
      <button
        className="profile-icon-btn"
        onClick={() => setIsDropDownOpen(!isDropDownOpen)}
      >
        <img src={Logo} className="icon-style" />
      </button>
      {isDropDownOpen && (
        <div className="dropdown-menu">
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}