import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { BookOpen, Search, Brain, BarChart3, Zap, Trophy, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export function LandingPage() {
  const features = [
    {
      icon: Search,
      title: "Semantic Search",
      description: "Find complex concepts across years of lecture material, not just keyword matches.",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: Brain,
      title: "MCQ Generation",
      description: "AI-powered question generation from your study materials to test knowledge and identify weak areas.",
      color: "bg-purple-50 text-purple-600",
    },
    {
      icon: BarChart3,
      title: "Performance Analysis",
      description: "Track your progress with detailed analytics and recommendations tailored to your learning patterns.",
      color: "bg-orange-50 text-orange-600",
    },
    {
      icon: Zap,
      title: "Smart Summaries",
      description: "Generate concise summaries and digests from lectures to grasp key concepts quickly.",
      color: "bg-green-50 text-green-600",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border py-4 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            <span className="text-2xl font-bold text-foreground">LearnBox</span>
          </div>
          
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
      <section className="bg-accent text-white px-6 py-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left side - Text */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Empower Your<br />Learning Journey
            </h1>
            <p className="text-lg text-white/90 leading-relaxed">
              LearnBox is a web-based academic learning platform designed for university students. 
              Access educational resources, practice MCQs, and manage academic content efficiently.
            </p>
            <div className="flex gap-4 pt-4">
              <Link to="/login">
                <Button className="bg-white hover:bg-white/90 text-accent rounded-full px-10 py-6 text-lg font-semibold">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-white hover:bg-white/90 text-accent rounded-full px-10 py-6 text-lg font-semibold">
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

      {/* Features Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Powerful Features for Smarter Learning
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              LearnBox combines cutting-edge AI with intuitive design to transform how you study and learn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-8 rounded-2xl border border-border hover:border-accent/50 transition-all hover:shadow-lg group"
                >
                  <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Semantic Search Deep Dive */}
      <section className="bg-white px-6 py-24 border-b border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-foreground">
              Semantic Search
            </h2>
            <p className="text-lg text-muted-foreground">
              Find complex concepts across years of lecture material. Go beyond keyword matching to understand the relationships between ideas.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Deep Indexing</h4>
                  <p className="text-sm text-muted-foreground">Understand context, not just keywords</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Cross-Year Access</h4>
                  <p className="text-sm text-muted-foreground">Search across all your academic materials</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Instant Results</h4>
                  <p className="text-sm text-muted-foreground">Get relevant answers in milliseconds</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-12 flex items-center justify-center min-h-96">
            <Search className="w-40 h-40 text-blue-200" strokeWidth={1} />
          </div>
        </div>
      </section>

      {/* MCQ Generation */}
      <section className="bg-gradient-to-b from-slate-50 to-white px-6 py-24 border-b border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-12 flex items-center justify-center min-h-96 order-2 md:order-1">
            <Brain className="w-40 h-40 text-purple-200" strokeWidth={1} />
          </div>
          <div className="space-y-6 order-1 md:order-2">
            <h2 className="text-4xl font-bold text-foreground">
              AI-Powered MCQ Generation
            </h2>
            <p className="text-lg text-muted-foreground">
              Transform your lecture notes into comprehensive practice tests. Our AI understands your material to create meaningful questions.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Dynamic Question Banks</h4>
                  <p className="text-sm text-muted-foreground">Unlimited practice questions from your material</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Difficulty Levels</h4>
                  <p className="text-sm text-muted-foreground">Customize questions from easy to advanced</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Instant Feedback</h4>
                  <p className="text-sm text-muted-foreground">Learn from detailed explanations</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Performance Analysis */}
      <section className="bg-white px-6 py-24 border-b border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-foreground">
              Performance Analysis & Recommendations
            </h2>
            <p className="text-lg text-muted-foreground">
              Get actionable insights into your learning journey. Understand your strengths and focus on areas that need improvement.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Detailed Analytics</h4>
                  <p className="text-sm text-muted-foreground">Visual breakdown of your performance</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Smart Recommendations</h4>
                  <p className="text-sm text-muted-foreground">Personalized study suggestions</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Progress Tracking</h4>
                  <p className="text-sm text-muted-foreground">Monitor your improvement over time</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-12 flex items-center justify-center min-h-96">
            <BarChart3 className="w-40 h-40 text-orange-200" strokeWidth={1} />
          </div>
        </div>
      </section>

      {/* Smart Summaries */}
      <section className="bg-gradient-to-b from-slate-50 to-white px-6 py-24 border-b border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-12 flex items-center justify-center min-h-96 order-2 md:order-1">
            <Zap className="w-40 h-40 text-green-200" strokeWidth={1} />
          </div>
          <div className="space-y-6 order-1 md:order-2">
            <h2 className="text-4xl font-bold text-foreground">
              10-Minute Lecture Digests
            </h2>
            <p className="text-lg text-muted-foreground">
              Transform lengthy lectures into concise, actionable summaries. Grasp the essence of your coursework without sacrificing understanding.
            </p>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Key Takeaways</h4>
                  <p className="text-sm text-muted-foreground">Extract essential concepts quickly</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Smart Formatting</h4>
                  <p className="text-sm text-muted-foreground">Well-organized, easy-to-read summaries</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground">Multiple Formats</h4>
                  <p className="text-sm text-muted-foreground">Text, bullet points, or mind maps</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="bg-white px-6 py-24 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-foreground mb-16">
            Why Choose LearnBox?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Trophy className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Designed for Success
              </h3>
              <p className="text-muted-foreground">
                Built by educators and students to address real academic challenges.
              </p>
            </div>
            
            <div className="text-center">
              <Clock className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Save Time
              </h3>
              <p className="text-muted-foreground">
                Spend less time searching and more time learning with intelligent tools.
              </p>
            </div>
            
            <div className="text-center">
              <Zap className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-foreground mb-3">
                Powered by AI
              </h3>
              <p className="text-muted-foreground">
                State-of-the-art artificial intelligence adapted for academic use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-accent to-primary text-white px-6 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-white/90">
            Join thousands of students already using LearnBox to master their degree.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/register">
              <Button className="bg-white hover:bg-white/90 text-accent rounded-full px-12 py-6 text-lg font-semibold flex items-center gap-2">
                Register
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/50 rounded-full px-12 py-6 text-lg font-semibold">
                Already a Member? Login
              </Button>
            </Link>
          </div>
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
                <li><Link to="/" className="hover:text-white transition-colors">Summaries</Link></li>
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
                <li><Link to="/" className="hover:text-white transition-colors">Cookie Policy</Link></li>
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
