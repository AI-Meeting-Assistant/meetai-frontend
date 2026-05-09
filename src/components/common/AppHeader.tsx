import { useState, useRef, useEffect } from "react";
import Logo from "../../assets/react.svg";
import { useAuth } from "../../contexts/AuthContext";

export function AppHeader() {
  const [isDropDownOpen, setIsDropDownOpen] = useState<boolean>(false);
  const { logout } = useAuth();
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
      <button
        className="profile-icon-btn"
        onClick={() => setIsDropDownOpen(!isDropDownOpen)}
      >
        <img src={Logo} className="icon-style" />
      </button>
      {isDropDownOpen && (
        <div className="dropdown-menu">
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}