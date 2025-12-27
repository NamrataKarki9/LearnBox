import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">LearnBox</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/about" className="text-foreground/70 hover:text-foreground transition">
              About Us
            </Link>
            <Link to="/support" className="text-foreground/70 hover:text-foreground transition">
              Support
            </Link>
            <Link to="/contact" className="text-foreground/70 hover:text-foreground transition">
              Contact Us
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
