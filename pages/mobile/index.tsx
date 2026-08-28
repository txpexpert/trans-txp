import Link from "next/link";

const modules = [
  { label: "Classement tarifaire", href: "/modules/classement" },
  { label: "Décisions de classement", href: "/modules/decisions-classement" },
  { label: "Glossaire douanier", href: "/tools/glossaire-douanier.html" },
  { label: "FAQ", href: "/modules/faq" },
  { label: "Substances dangereuses", href: "/tools/Substances-dangereuses.html" },
  { label: "Marquage & warnings", href: "/tools/marquage-warnings.html" },
  { label: "Calculateur conteneurs", href: "/tools/calc-conteneurs.html" },
  { label: "Calculateur colis SRE", href: "/tools/calc-colis-sre-v3.html" },
];

export default function MobileHome() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#1A5C2A", fontSize: "22px", marginBottom: "16px" }}>
        Transit-IA
      </h1>
      <div style={{ display: "grid", gap: "12px" }}>
        {modules.map((m) => (
          <Link key={m.href} href={m.href} style={{
            display: "block", padding: "16px", borderRadius: "10px",
            background: "#E8F5E9", color: "#1C1C1C", textDecoration: "none",
            fontWeight: 600, border: "1px solid #1A5C2A22"
          }}>
            {m.label}
          </Link>
        ))}
      </div>
    </div>
  );

}