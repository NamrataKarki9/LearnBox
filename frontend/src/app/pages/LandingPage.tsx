import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BookOpen } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[#F5F5F5] py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-2xl font-semibold text-foreground">LearnBox</div>
          
          <div className="flex items-center gap-3">
            <Select>
              <SelectTrigger className="w-[180px] bg-accent text-accent-foreground border-0 rounded-full">
                <SelectValue placeholder="Select College" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="university-a">University A</SelectItem>
                <SelectItem value="university-b">University B</SelectItem>
                <SelectItem value="college-c">College C</SelectItem>
                <SelectItem value="institute-d">Institute D</SelectItem>
              </SelectContent>
            </Select>
            
            <Link to="/login">
              <Button className="bg-accent hover:bg-accent/90 text-white rounded-full px-8">
                Login
              </Button>
            </Link>
            
            <Link to="/register">
              <Button className="bg-accent hover:bg-accent/90 text-white rounded-full px-8">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 bg-accent">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div className="text-white space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Empower Your<br />Learning Journey
            </h1>
            <p className="text-lg text-white/90 leading-relaxed">
              LearnBox is a web-based academic learning platform designed for university students. 
              Access educational resources, practice MCQs, and manage academic content efficiently.
            </p>
            <div className="flex gap-4 pt-4">
              <Link to="/login">
                <Button className="bg-white hover:bg-white/90 text-accent rounded-full px-10 py-6 text-lg">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-white hover:bg-white/90 text-accent rounded-full px-10 py-6 text-lg">
                  Register
                </Button>
              </Link>
            </div>
          </div>

          {/* Right side - Books Image */}
          <div className="flex justify-center items-center">
            <div className="w-full max-w-lg flex items-center justify-center">
              <BookOpen className="w-64 h-64 text-white/20" strokeWidth={1} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F5F5F5] py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-3">LearnBox</h3>
              <p className="text-sm text-muted-foreground">
                Your academic learning companion.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">About Us</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/our-story" className="hover:text-foreground">Our Story</Link></li>
                <li><Link to="/mission" className="hover:text-foreground">Mission</Link></li>
                <li><Link to="/team" className="hover:text-foreground">Team</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/help" className="hover:text-foreground">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-foreground">Contact Us</Link></li>
                <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              2025 LearnBox. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
