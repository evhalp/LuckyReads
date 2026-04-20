import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/luckyreadslogo_navbar.png";
import { clearSession, getUserInitials } from "../../app/session";
import "./Navbar.css";

export default function Navbar() {
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const navItems = [
        { label: "Home", to: "/home" },
        { label: "My Shelf", to: "/my-shelf" },
        { label: "Find Readers", to: "/find-readers" },
    ];
    const initials = getUserInitials();

    useEffect(() => {
        if (!menuOpen) {
            return undefined;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [menuOpen]);

    const handleLogout = () => {
        clearSession();
        navigate("/login", { replace: true });
    };

    const handleProfile = () => {
        setMenuOpen(false);
        navigate("/profile");
    };

    return (
        <nav className="navbar">
            <div className="navbar__inner">
                <NavLink to="/home" className="navbar-logo" aria-label="LuckyReads home">
                    <img src={logo} alt="LuckyReads" className="navbar-logo__image" />
                </NavLink>

                <div className="navbar-links">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                isActive
                                    ? "navbar-link navbar-link--active"
                                    : "navbar-link"
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </div>

                <div className="navbar-profile" ref={menuRef}>
                    <button
                        type="button"
                        className="navbar-avatar"
                        aria-label="Open profile menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((current) => !current)}
                    >
                        {initials}
                    </button>

                    {menuOpen ? (
                        <div className="navbar-menu" role="menu" aria-label="Profile menu">
                            <button
                                type="button"
                                className="navbar-menu__item"
                                role="menuitem"
                                onClick={handleProfile}
                            >
                                Profile
                            </button>
                            <button
                                type="button"
                                className="navbar-menu__item"
                                role="menuitem"
                                onClick={handleLogout}
                            >
                                Log out
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </nav>
    );
}
