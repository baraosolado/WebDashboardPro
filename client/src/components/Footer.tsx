import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© {currentYear} SolandoX - Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}