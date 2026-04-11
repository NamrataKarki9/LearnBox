import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

export function Footer() {
  const sections = [
    {
      title: "About Us",
      links: [{ label: "Our Story", path: "/" }, { label: "Mission", path: "/" }, { label: "Team", path: "/" }],
    },
    {
      title: "Support",
      links: [{ label: "Help Center", path: "/help" }, { label: "Contact Us", path: "/contact" }, { label: "FAQ", path: "/" }],
    },
    {
      title: "Legal",
      links: [{ label: "Privacy Policy", path: "/" }, { label: "Terms of Service", path: "/" }],
    },
  ];

  return (
    <footer
      style={{
        background: "#EDE5D4",
        borderTop: "2px solid #D4C5A9",
        padding: "48px 40px 28px",
        marginTop: "auto",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 48,
            paddingBottom: 36,
            borderBottom: "1px solid #D4C5A9",
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <BookOpen size={18} color="#C0392B" strokeWidth={2} />
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 800,
                  fontSize: 18,
                  color: "#1C1208",
                }}
              >
                LearnBox
              </span>
            </div>
            <p
              style={{
                fontFamily: "'Lora', Georgia, serif",
                fontSize: 13,
                color: "#7A6A52",
                lineHeight: 1.7,
                margin: 0,
                maxWidth: 220,
              }}
            >
              Your scholarly command centre for lectures, slides, and academic excellence.
            </p>
          </div>

          {sections.map(({ title, links }) => (
            <div key={title}>
              <h4
                style={{
                  fontFamily: "'Barlow Semi Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#1C1208",
                  marginBottom: 14,
                }}
              >
                {title}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {links.map(({ label, path }) => (
                  <li key={label}>
                    <Link
                      to={path}
                      style={{
                        fontFamily: "'Lora', Georgia, serif",
                        fontSize: 13,
                        color: "#7A6A52",
                        textDecoration: "none",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C0392B")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7A6A52")}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p
            style={{
              fontFamily: "'Barlow Semi Condensed', sans-serif",
              fontSize: 11,
              color: "#7A6A52",
              margin: 0,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            © 2025 LearnBox. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: 20 }}>
            {["Twitter", "LinkedIn", "GitHub"].map((s) => (
              <Link
                key={s}
                to="/"
                style={{
                  fontFamily: "'Barlow Semi Condensed', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#7A6A52",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#C0392B")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#7A6A52")}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
