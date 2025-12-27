import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-primary mb-4">LearnBox</h3>
            <p className="text-sm text-muted-foreground">
              Your academic learning companion.
            </p>
          </div>
          
          <div>
            <h4 className="mb-4">About Us</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/our-story" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/mission" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Mission
                </Link>
              </li>
              <li>
                <Link to="/team" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Team
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 LearnBox. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
