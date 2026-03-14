import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { BookOpen, Mail, Phone, MapPin, Send } from "lucide-react";

export function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    setFormData({ name: "", email: "", subject: "", message: "" });
    alert("Thank you for contacting us! We'll get back to you shortly.");
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      detail: "karkinamrata030@gmail.com",
      description: "We respond within 24 hours",
    },
    {
      icon: Phone,
      title: "Phone",
      detail: "+977 9841001742",
      description: "Available during business hours",
    },
    {
      icon: MapPin,
      title: "Office",
      detail: "Naxal, Kathmandu",
      description: "Nepal",
    },
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
          <h1 className="text-5xl md:text-6xl font-bold">Get in Touch</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Have a question or feedback? We'd love to hear from you. Our team is here to help.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="bg-white px-6 py-16 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactInfo.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-full mb-4">
                    <Icon className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-lg font-semibold text-accent mb-1">{item.detail}</p>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="bg-slate-50 px-6 py-20 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 md:p-12 border border-border">
            <h2 className="text-3xl font-bold text-foreground mb-2">Send us a Message</h2>
            <p className="text-muted-foreground mb-8">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-accent hover:bg-accent/90 text-white rounded-lg px-6 py-3 text-lg font-semibold flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white px-6 py-20 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mb-12">
            Can't find the answer you're looking for? Check our <Link to="/help" className="text-accent font-semibold">help center</Link>.
          </p>

          <div className="space-y-4">
            {[
              {
                q: "What's the response time for inquiries?",
                a: "We typically respond to all inquiries within 24 hours.",
              },
              {
                q: "How can I reach LearnBox?",
                a: "You can reach us at karkinamrata030@gmail.com or +977 9841001742.",
              },
              {
                q: "Can I visit your office?",
                a: "Yes! You can visit us at our office in Naxal, Kathmandu. Please get in touch first.",
              },
              {
                q: "Are there partnership opportunities?",
                a: "Absolutely! We're always interested in partnerships with educational institutions. Please reach out to discuss possibilities.",
              },
            ].map((faq, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-6 border border-border">
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
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
