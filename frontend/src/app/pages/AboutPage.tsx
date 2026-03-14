import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { BookOpen, Users, Target, Heart, Zap, Award } from "lucide-react";

export function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const team = [
    {
      name: "Namrata Karki",
      role: "Founder & CEO",
      description: "Visionary leader driving LearnBox's mission to transform education through AI.",
      icon: "👩‍💼",
    },
    {
      name: "Aayusha Kandel",
      role: "Product & Design Lead",
      description: "Creates intuitive user experiences that make learning accessible to all.",
      icon: "👩‍🎨",
    },
    {
      name: "Ashika Kambang",
      role: "Technology Lead",
      description: "Builds robust AI systems and backend infrastructure for LearnBox.",
      icon: "👩‍💻",
    },
    {
      name: "Subu",
      role: "Operations & Growth",
      description: "Scales LearnBox and builds partnerships with educational institutions.",
      icon: "👨‍💼",
    },
  ];

  const values = [
    {
      icon: Heart,
      title: "Student-Centric",
      description: "Everything we build is designed with students' success in mind.",
    },
    {
      icon: Zap,
      title: "Innovation First",
      description: "We constantly push boundaries with cutting-edge AI and technology.",
    },
    {
      icon: Award,
      title: "Quality Learning",
      description: "We believe in measurable learning outcomes and real academic impact.",
    },
    {
      icon: Users,
      title: "Community",
      description: "We foster a supportive community where students help each other learn.",
    },
  ];

  const milestones = [
    { year: "2025", title: "Founded", description: "LearnBox launched with core AI-powered learning features" },
    { year: "2025", title: "Beta Launch", description: "Launched beta with early adopters and feedback integration" },
    { year: "2026", title: "Expansion", description: "Expanded team and enhanced platform capabilities" },
    { year: "2026", title: "Scale", description: "Growing user base and institutional partnerships" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            <span className="text-2xl font-bold text-foreground">LearnBox</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button className="bg-transparent border border-accent text-accent hover:bg-accent hover:text-white rounded-full px-6">
                Login
              </Button>
            </Link>
            
            <Link to="/register">
              <Button className="bg-accent hover:bg-accent/90 text-white rounded-full px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-accent to-accent/95 text-white px-6 py-20">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold">About LearnBox</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Reimagining how students learn and master their degrees with AI-powered tools.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-white px-6 py-20 border-b border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-foreground">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We believe every student deserves access to intelligent learning tools that adapt to their unique needs. LearnBox transforms passive learning into active, measurable progress.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              By combining cutting-edge AI with pedagogical expertise, we create a learning experience that's not just informative, but truly transformative.
            </p>
          </div>
          <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl p-12 flex items-center justify-center min-h-96">
            <Target className="w-40 h-40 text-accent/30" strokeWidth={1} />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-slate-50 px-6 py-20 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-foreground mb-16">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl border border-border hover:border-accent/50 transition-all"
                >
                  <Icon className="w-10 h-10 text-accent mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-white px-6 py-20 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-foreground mb-16">Our Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-accent">{milestone.year}</p>
                    <h3 className="text-lg font-bold text-foreground">{milestone.title}</h3>
                  </div>
                </div>
                <p className="text-muted-foreground ml-16">{milestone.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-slate-50 px-6 py-20 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-foreground mb-4">Meet Our Team</h2>
          <p className="text-center text-muted-foreground text-lg mb-16 max-w-2xl mx-auto">
            A diverse team of educators, engineers, and innovators united by a passion for transforming education.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 text-center border border-border hover:border-accent/50 transition-all">
                <div className="text-5xl mb-4">{member.icon}</div>
                <h3 className="text-xl font-bold text-foreground mb-1">{member.name}</h3>
                <p className="text-accent font-semibold mb-3">{member.role}</p>
                <p className="text-muted-foreground">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-accent to-primary text-white px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to Join Our Community?</h2>
          <p className="text-xl text-white/90">Start your journey with LearnBox today.</p>
          <Link to="/register">
            <Button className="bg-white hover:bg-white/90 text-accent rounded-full px-10 py-6 text-lg font-semibold">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5" />
                <span className="text-lg font-bold">LearnBox</span>
              </div>
              <p className="text-sm text-gray-400">
                Your scholarly command center for lectures, slides, and academic excellence.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Semantic Search</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">MCQ Generation</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Analytics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                © 2025 LearnBox. All rights reserved.
              </p>
              <div className="flex gap-6 mt-4 md:mt-0">
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">Twitter</Link>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">LinkedIn</Link>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">GitHub</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
