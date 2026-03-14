import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { BookOpen, Search, ChevronDown, FileText, MessageCircle } from "lucide-react";

export function HelpPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [openCategory, setOpenCategory] = useState<number | null>(0);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const categories = [
    {
      title: "Getting Started",
      icon: FileText,
      articles: [
        {
          id: 1,
          title: "How to Create an Account",
          description: "Step-by-step guide to signing up for LearnBox",
          answer: "To create an account on LearnBox:\n\n1. Click the 'Get Started' button on the landing page\n2. Fill in your email address and create a strong password\n3. Enter your full name and select your college/university\n4. Verify your email by clicking the link sent to your inbox\n5. Complete your profile by adding a profile picture and interests\n6. Accept the terms and conditions\n7. You're all set! Log in to start learning.",
        },
        {
          id: 2,
          title: "First Steps After Registration",
          description: "What to do after creating your account",
          answer: "After registering on LearnBox:\n\n1. Complete your profile with a profile picture and bio\n2. Add your college/university and course details\n3. Upload your lecture materials or notes\n4. Explore the dashboard to familiarize yourself with features\n5. Check out the semantic search feature to find materials\n6. Join study groups if available in your institution\n7. Start with a practice MCQ to get familiar with the quiz interface",
        },
        {
          id: 3,
          title: "Accessing Your Dashboard",
          description: "Navigate your personal learning dashboard",
          answer: "Your LearnBox Dashboard provides:\n\n1. Overview: Quick stats on your learning progress\n2. Recent Materials: Access your recently viewed lecture notes\n3. Ongoing Tests: See active MCQ sessions and deadlines\n4. Progress Analytics: View your performance metrics\n5. Study Groups: Connect with classmates\n6. Settings: Customize your learning preferences\n7. Navigation Menu: Use the sidebar to access all features",
        },
      ],
    },
    {
      title: "Semantic Search",
      icon: Search,
      articles: [
        {
          id: 4,
          title: "How to Use Semantic Search",
          description: "Find concepts across all your lecture materials",
          answer: "Semantic Search helps you find related concepts, not just keywords:\n\n1. Go to the Search tab in your dashboard\n2. Type a concept you're looking for (e.g., 'photosynthesis')\n3. Search results show all related materials and concepts\n4. Results are ranked by relevance to your query\n5. Click on any result to view the full lecture or note\n6. Use filters to narrow down by subject or date\n7. Save frequently searched topics as favorites",
        },
        {
          id: 5,
          title: "Advanced Search Tips",
          description: "Master advanced search filters and operators",
          answer: "Advanced Search Tips:\n\n1. Use quotes: 'photosynthesis process' for exact phrases\n2. Exclude words: Use minus sign - 'photosynthesis -artificial'\n3. Filter by date: Search materials from specific time periods\n4. Filter by source: Search in specific lecture notes or subjects\n5. Related topics: See suggestions for related concepts\n6. Search history: View and reuse previous searches\n7. Combine multiple filters for precise results",
        },
        {
          id: 6,
          title: "Search Across Year Materials",
          description: "Search through all your academic years",
          answer: "Search Across Multiple Years:\n\n1. In the search settings, enable 'Search All Years'\n2. Select date range for your search\n3. View results organized by academic year\n4. Compare materials from different years\n5. Track concept evolution across your studies\n6. Create year-wise comparison reports\n7. Archive old materials while keeping them searchable",
        },
      ],
    },
    {
      title: "MCQ Generation",
      icon: FileText,
      articles: [
        {
          id: 7,
          title: "Generating Practice Questions",
          description: "Create MCQs from your lecture notes",
          answer: "Generate Practice Questions:\n\n1. Go to MCQ Practice section\n2. Click 'Generate New Questions'\n3. Select the lecture or topic material\n4. Choose number of questions (5-50)\n5. Select difficulty level: Easy, Medium, or Hard\n6. Click Generate - AI will create questions\n7. Review and start practicing immediately\n8. Answers include detailed explanations",
        },
        {
          id: 8,
          title: "Customizing Question Difficulty",
          description: "Adjust difficulty levels for practice",
          answer: "Customize Question Difficulty:\n\n1. Easy: Basic concept understanding (definition and facts)\n2. Medium: Application of concepts (can be applied in scenarios)\n3. Hard: Analysis and critical thinking (requires deep understanding)\n4. Mix Mode: Combination of all difficulty levels\n5. Adaptive: System adjusts based on your performance\n6. Track difficulty progression in your analytics\n7. Use harder questions closer to exams",
        },
        {
          id: 9,
          title: "Understanding Feedback",
          description: "Learn from detailed question explanations",
          answer: "MCQ Feedback Features:\n\n1. Correct Answer: Shows why the right answer is correct\n2. Explanation: Detailed concept explanation from your materials\n3. Related Topics: Links to related lectures and notes\n4. Common Mistakes: Shows why other options are wrong\n5. Concept Map: Visual representation of connected concepts\n6. Additional Resources: References for further learning\n7. Performance tips: Suggestions based on your mistakes",
        },
      ],
    },
    {
      title: "Analytics & Performance",
      icon: FileText,
      articles: [
        {
          id: 10,
          title: "Understanding Your Performance Dashboard",
          description: "Interpret your learning analytics",
          answer: "Performance Dashboard Breakdown:\n\n1. Overall Score: Your aggregate performance percentage\n2. Subject Breakdown: Performance in each subject/course\n3. Topic Analysis: Strength and weakness by topic\n4. Time Tracking: Hours spent studying by subject\n5. Progress Chart: Visual representation of improvement over time\n6. Comparison: Your performance vs. class average\n7. Learning Rate: Pace of your progress",
        },
        {
          id: 11,
          title: "Reading Performance Recommendations",
          description: "Get personalized study suggestions",
          answer: "Personalized Recommendations:\n\n1. Weak Areas: System identifies topics with low performance\n2. Suggested Materials: Specific lectures to review\n3. Practice Plans: Recommended practice questions by topic\n4. Study Schedule: AI-generated study timetable\n5. Peer Comparison: See how you compare with peers\n6. Next Steps: Actionable suggestions for improvement\n7. Goal Tracking: Progress toward learning goals",
        },
        {
          id: 12,
          title: "Tracking Your Progress",
          description: "Monitor improvement over time",
          answer: "Progress Tracking:\n\n1. Daily Streaks: Track consecutive study days\n2. Learning Goals: Set and track custom goals\n3. Milestone Achievements: Badges for milestones reached\n4. Historical Data: Review past performance\n5. Trend Analysis: See improvement patterns\n6. Export Reports: Download progress reports for teachers\n7. Progress Sharing: Share achievements with friends",
        },
      ],
    },
    {
      title: "Summaries & Digests",
      icon: FileText,
      articles: [
        {
          id: 13,
          title: "Generating Lecture Summaries",
          description: "Create quick summaries from lectures",
          answer: "Generate Summaries:\n\n1. Open any lecture material\n2. Click 'Generate Summary' button\n3. Choose summary length: Short (2 min), Medium (5 min), or Long (10 min)\n4. AI analyzes the material and creates a concise summary\n5. Summary includes key points and concepts\n6. View in different formats (text, bullets, etc.)\n7. Download or share with classmates",
        },
        {
          id: 14,
          title: "Summary Formats",
          description: "Choose between text, bullets, and mind maps",
          answer: "Available Summary Formats:\n\n1. Text Format: Paragraph-style narrative summary\n2. Bullet Points: Key points in easy-to-scan format\n3. Mind Map: Visual representation of concepts\n4. Outline: Hierarchical structure of topics\n5. Flashcards: Key terms with definitions\n6. Timeline: Chronological breakdown if applicable\n7. Formula Sheet: Important equations and formulas",
        },
        {
          id: 15,
          title: "Exporting Summaries",
          description: "Save and share your summaries",
          answer: "Export & Share Summaries:\n\n1. Click Export button on summary\n2. Choose format: PDF, Word, or Image\n3. Download to your device\n4. Share via email or messaging apps\n5. Create a summary collection (study guide)\n6. Print-friendly versions available\n7. Cloud storage integration for easy access",
        },
      ],
    },
    {
      title: "Account & Settings",
      icon: FileText,
      articles: [
        {
          id: 16,
          title: "Managing Your Profile",
          description: "Update your personal information",
          answer: "Profile Management:\n\n1. Go to Settings > Profile\n2. Update profile picture\n3. Edit name and contact information\n4. Add or change your college/university\n5. Update your interests and specialization\n6. Set learning preferences\n7. Choose notification settings\n8. Save changes",
        },
        {
          id: 17,
          title: "Privacy Settings",
          description: "Control your data and privacy",
          answer: "Privacy Controls:\n\n1. Profile Visibility: Make profile public or private\n2. Data Usage: Control what data LearnBox can use\n3. Marketing Emails: Opt-in/out of promotional emails\n4. Activity Sharing: Control who sees your learning activity\n5. Analytics Consent: Allow usage for improving the platform\n6. Download Data: Request your personal data export\n7. Account Deletion: Permanently delete your account if needed",
        },
        {
          id: 18,
          title: "Password & Security",
          description: "Keep your account secure",
          answer: "Secure Your Account:\n\n1. Change Password: Go to Settings > Security\n2. Use strong passwords: Mix of uppercase, lowercase, numbers, symbols\n3. Two-Factor Authentication: Enable for extra security\n4. Active Sessions: See and manage active login sessions\n5. Login History: Review recent login activity\n6. Trusted Devices: Recognize devices to reduce 2FA prompts\n7. Report Suspicious Activity: Contact support immediately if needed",
        },
      ],
    },
  ];

  const filteredCategories = categories.map((category) => ({
    ...category,
    articles: category.articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.answer.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((category) => category.articles.length > 0);

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
          <h1 className="text-5xl md:text-6xl font-bold">Help Center</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Find answers to your questions and learn how to make the most of LearnBox.
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="bg-white px-6 py-12 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          {searchTerm && (
            <p className="mt-3 text-sm text-muted-foreground">
              Found {filteredCategories.reduce((sum, cat) => sum + cat.articles.length, 0)} results for "{searchTerm}"
            </p>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-slate-50 px-6 py-20 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12">Browse by Category</h2>
          
          <div className="space-y-4">
            {filteredCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div key={index} className="bg-white rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setOpenCategory(openCategory === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Icon className="w-6 h-6 text-accent" />
                      <h3 className="text-lg font-semibold text-foreground">{category.title}</h3>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${
                        openCategory === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openCategory === index && (
                    <div className="bg-slate-50 border-t border-border px-6 py-4 space-y-4">
                      {category.articles.map((article) => (
                        <div key={article.id} className="bg-white rounded-lg p-4 border border-border hover:border-accent/50 transition-all cursor-pointer">
                          <button
                            onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground hover:text-accent transition-colors">
                                  {article.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">{article.description}</p>
                              </div>
                              <ChevronDown
                                className={`w-5 h-5 text-muted-foreground flex-shrink-0 ml-4 transition-transform ${
                                  expandedArticle === article.id ? "rotate-180" : ""
                                }`}
                              />
                            </div>
                          </button>

                          {expandedArticle === article.id && (
                            <div className="mt-4 pt-4 border-t border-border">
                              <p className="text-foreground whitespace-pre-wrap leading-relaxed text-sm">
                                {article.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredCategories.length === 0 && searchTerm && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No results found for "{searchTerm}". Try different keywords.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="bg-gradient-to-r from-accent to-primary text-white px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <MessageCircle className="w-16 h-16 mx-auto opacity-80" />
          <h2 className="text-4xl font-bold">Didn't find what you're looking for?</h2>
          <p className="text-xl text-white/90">
            Contact our support team and we'll be happy to help you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/contact">
              <Button className="bg-white hover:bg-white/90 text-accent rounded-full px-10 py-6 text-lg font-semibold">
                Contact Support
              </Button>
            </Link>
            <Link to="/">
              <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/50 rounded-full px-10 py-6 text-lg font-semibold">
                Back to Home
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
