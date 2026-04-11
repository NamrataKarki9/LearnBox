import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export function Header() {
  const softButtonStyle = {
    fontFamily: "'Barlow Semi Condensed', sans-serif",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    fontSize: 13,
    padding: "9px 22px",
    border: "none",
    boxShadow: "inset 0 0 0 1px #D4C5A9",
    background: "#EDE5D4",
    color: "#3D2E18",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
  };

  return (
    <header
      style={{
        background: "#FAF7F0",
        borderBottom: "2px solid #1C1208",
        padding: "0 40px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <BookOpen size={20} color="#C0392B" strokeWidth={2} />
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#1C1208",
            letterSpacing: "-0.02em",
          }}
        >
          LearnBox
        </span>
      </Link>

      <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {[
          { label: "About", path: "/about" },
          { label: "Support", path: "/help" },
          { label: "Contact", path: "/contact" },
        ].map(({ label, path }) => (
          <Link
            key={label}
            to={path}
            style={{
              fontFamily: "'Barlow Semi Condensed', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#3D2E18",
              textDecoration: "none",
              borderBottom: "2px solid transparent",
              paddingBottom: 2,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderBottomColor = "#C0392B";
              (e.currentTarget as HTMLElement).style.color = "#C0392B";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderBottomColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#3D2E18";
            }}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/login">
          <button
            style={softButtonStyle}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#F5F0E8";
              (e.currentTarget as HTMLElement).style.color = "#1C1208";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#EDE5D4";
              (e.currentTarget as HTMLElement).style.color = "#3D2E18";
            }}
          >
            Login
          </button>
        </Link>
        <Link to="/register">
          <button
            style={{
              ...softButtonStyle,
              background: "#F5E6E4",
              color: "#8B3327",
              boxShadow: "inset 0 0 0 1px #E7C4BF",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#F8ECEA";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#F5E6E4";
            }}
          >
            Register
          </button>
        </Link>
      </div>
    </header>
  );
}
