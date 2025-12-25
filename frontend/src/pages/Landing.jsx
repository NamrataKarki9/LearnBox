import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import './Landing.css';

const Landing = () => {
  const features = [
    {
      icon: '🔍',
      title: 'Semantic Search',
      description: 'Find relevant academic resources instantly with AI-powered semantic search technology.'
    },
    {
      icon: '📚',
      title: 'AI Summaries',
      description: 'Get concise, AI-generated summaries of complex academic materials in seconds.'
    },
    {
      icon: '✅',
      title: 'MCQ Practice',
      description: 'Test your knowledge with intelligent multiple-choice questions tailored to your learning.'
    },
    {
      icon: '🎓',
      title: 'Cross-Year Access',
      description: 'Access resources from multiple academic years and departments in one unified platform.'
    },
    {
      icon: '💡',
      title: 'Smart Learning',
      description: 'Personalized learning paths powered by AI to maximize your academic success.'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Monitor your learning progress with detailed analytics and insights.'
    }
  ];

  return (
    <div className="landing-page">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            AI-Enhanced Academic Resource Platform
          </h1>
          <p className="hero-subtitle">
            Revolutionize your learning experience with cutting-edge AI technology.
            Access, understand, and master academic content like never before.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Login to Your Account
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-illustration">
            🎓
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Powerful Features for Modern Learning</h2>
          <p className="section-subtitle">
            Everything you need to excel in your academic journey
          </p>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Ready to Transform Your Learning?</h2>
          <p className="cta-subtitle">
            Join thousands of students already using LearnBox to achieve academic excellence
          </p>
          <div className="cta-buttons">
            <Link to="/signup" className="btn btn-primary btn-large">
              Create Free Account
            </Link>
            <Link to="/login" className="btn btn-outline btn-large">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
