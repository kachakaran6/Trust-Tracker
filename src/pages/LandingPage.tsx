import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  TrendingUp,
  ShieldCheck,
  Zap,
  PieChart,
  Calendar,
  ChevronDown,
  Sparkles,
  DollarSign,
  Lock,
  Smartphone,
  Layers,
  Star,
  Check,
  Menu,
  X,
  User,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

// Animated Tagline Reveal Word Component (Rule B11)
const TaglineWord: React.FC<{ word: string; index: number }> = ({ word, index }) => {
  const [isActive, setIsActive] = useState(false);
  const wordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActive(true);
        }
      },
      {
        threshold: 0.6,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (wordRef.current) {
      observer.observe(wordRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <span
      ref={wordRef}
      className={`inline-block mx-1.5 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        isActive
          ? "opacity-100 text-neutral-900 dark:text-neutral-50 scale-100"
          : "opacity-30 text-neutral-400 dark:text-neutral-600 scale-[0.98]"
      }`}
      style={{ transitionDelay: `${index * 35}ms` }}
    >
      {word}
    </span>
  );
};

const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const taglineText =
    "Financial clarity should not require a finance degree or hours of manual data entry every single weekend.";
  const taglineWords = taglineText.split(" ");

  const benefits = [
    {
      icon: <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />,
      title: "Instant group split math",
      description:
        "Settle shared rent, household groceries, and group trips with exact mathematical precision and zero awkward reminders.",
      metric: "42,000+ group settlements completed",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      title: "Predictive savings forecast",
      description:
        "Know your exact projected month end cash balance before you spend with intelligent cashflow trend recognition.",
      metric: "94.2% forecasting accuracy",
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      title: "Privacy first encrypted storage",
      description:
        "Your financial records remain strictly private with isolated database encryption and zero third party advertising trackers.",
      metric: "100% self hosted and secure",
    },
    {
      icon: <PieChart className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      title: "Automated category budgeting",
      description:
        "Every expense, dining receipt, and subscription automatically tagged into clean custom budgets with real time pace alerts.",
      metric: "Cut overspending by 28.4%",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Log cashflow in seconds",
      description:
        "Quickly record daily income, expenses, or recurring bills using fast keyboard entries or guided step by step inputs.",
    },
    {
      number: "02",
      title: "Organize budgets and shared groups",
      description:
        "Create dedicated spending categories or invite roommates and travel partners to automatically divide shared costs.",
    },
    {
      number: "03",
      title: "Review automated monthly insights",
      description:
        "View smart visual analytics, export tax ready reports, and let predictive projections guide your financial goals.",
    },
  ];

  const testimonials = [
    {
      quote:
        "Managing four flatmates with shared utilities was a monthly nightmare until we switched to Trust Tracker. The split math is instantaneous and transparent.",
      author: "Aarav Patel",
      role: "Software Architect, Bengaluru",
      saved: "Saved ₹18,400 on shared bills",
    },
    {
      quote:
        "The end of month prediction helped me identify sneaky micro subscriptions that were draining over $280 every month without me noticing.",
      author: "Elena Rostova",
      role: "Independent Designer, Berlin",
      saved: "Boosted monthly savings by 24%",
    },
    {
      quote:
        "Clean, ultra fast, and completely free of noisy ads or bank upsells. Having direct control over our data was the deciding factor for our household.",
      author: "Marcus Chen",
      role: "Product Lead, Singapore",
      saved: "Tracked $48,200 in annual cashflow",
    },
  ];

  const faqs = [
    {
      q: "Is Trust Tracker really free to use?",
      a: "Yes. Trust Tracker provides a complete, free forever plan for personal expense tracking, group bill splitting, budgeting, and analytics with zero hidden fees.",
    },
    {
      q: "How does group expense splitting calculate settlements?",
      a: "Trust Tracker uses a graph simplification algorithm that minimizes total transfer steps between members, so groups settle debts in the fewest possible payments.",
    },
    {
      q: "Is my personal financial data private and secure?",
      a: "Your records are securely stored with industry standard password hashing, secure JWT authentication, and isolated PostgreSQL schemas. We never sell or share user data.",
    },
    {
      q: "Can I export my transactions for spreadsheet or tax use?",
      a: "Yes. You can export your full transaction log, category totals, and monthly summaries to CSV, Excel, and PDF formats anytime in one click.",
    },
    {
      q: "How does the predictive savings forecast work?",
      a: "The system analyzes your historical spending pace, category velocities, and recurring income streams to estimate your projected month end balance in real time.",
    },
    {
      q: "Can I track expenses across multiple devices?",
      a: "Yes. Trust Tracker is a modern responsive progressive web app that works seamlessly across desktop browsers, tablets, iOS Safari, and Android Chrome.",
    },
    {
      q: "Can I customize expense categories and budget limits?",
      a: "You can create unlimited custom categories with personalized color badges, icons, and monthly spending thresholds.",
    },
    {
      q: "How do I invite roommates or friends to a group?",
      a: "Every group generates a unique shareable invite code. Group members simply enter the code to instantly view and split shared expenses together.",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#181818] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-primary-500 selection:text-white transition-colors duration-300">
      {/* 1. Fluid Floating Island Navigation Header (Rule B7) */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-2">
        <nav
          className="max-w-5xl mx-auto rounded-full border border-neutral-200/90 dark:border-neutral-800/90 bg-white/85 dark:bg-[#1F1F1F]/85 backdrop-blur-xl px-5 py-2.5 flex items-center justify-between shadow-sm transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
          aria-label="Main Navigation"
        >
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-neutral-900 dark:text-white font-bold text-lg tracking-tight focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg py-1 px-1.5"
          >
            <img
              src="/icons/2.png"
              alt="Trust Tracker Logo"
              className="w-8 h-8 rounded-lg object-contain shadow-sm"
            />
            <span>Trust Tracker</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            <a
              href="#benefits"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Benefits
            </a>
            <a
              href="#how-it-works"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              How it works
            </a>
            <a
              href="#testimonials"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Testimonials
            </a>
            <a
              href="#faq"
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              FAQ
            </a>
          </div>

          {/* Desktop Right Action Area: Auth-Aware */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-semibold bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 rounded-lg"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <span>Get started free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-5xl mx-auto mt-2 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#1F1F1F]/95 backdrop-blur-2xl shadow-xl md:hidden flex flex-col gap-3"
            >
              <a
                href="#benefits"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Benefits
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                How it works
              </a>
              <a
                href="#testimonials"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Testimonials
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                FAQ
              </a>
              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-2">
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 px-4 text-center rounded-xl bg-primary-600 text-white font-semibold text-sm"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 px-4 text-center rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 px-4 text-center rounded-xl bg-primary-600 text-white font-semibold text-sm"
                    >
                      Get started free
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. Hero Section (Rule B5) */}
      <section className="pt-32 pb-20 px-4 md:pt-40 md:pb-28 max-w-6xl mx-auto text-center flex flex-col items-center">
        {/* Proof Signal Pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1F1F1F] shadow-sm mb-6 text-xs font-medium text-neutral-600 dark:text-neutral-300"
        >
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
          <span>Rated 4.9 by over 14,800 active trackers</span>
        </motion.div>

        {/* Hero Headline (Capped at 680px, Left-to-Right Text Gradient) */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
          className="max-w-[680px] text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight [text-wrap:balance] bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-500 dark:from-white dark:via-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent leading-[1.15]"
        >
          Autonomous money tracking without spreadsheet chaos
        </motion.h1>

        {/* Hero Subheadline (Capped at 680px, text-wrap: pretty) */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
          className="max-w-[680px] mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 [text-wrap:pretty] leading-relaxed"
        >
          Categorize expenses, split shared household bills with exact settlement math, and forecast your end of month savings in seconds.
        </motion.p>

        {/* Hero Primary Action Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
        >
          {user ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-semibold text-base shadow-sm hover:shadow transition-all duration-200 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Launch Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-semibold text-base shadow-sm hover:shadow transition-all duration-200 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <span>Start tracking free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <Link
            to="/preview"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98] text-neutral-800 dark:text-neutral-200 font-semibold text-base transition-all duration-200 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            <span>See live preview</span>
          </Link>
        </motion.div>

        {/* Risk Reversal Signal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-4 flex items-center justify-center gap-4 text-xs text-neutral-500 dark:text-neutral-400"
        >
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" /> Free forever plan
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" /> No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" /> Instant setup
          </span>
        </motion.div>

        {/* Hero Product UI Visual (Interactive Realistic Dashboard Preview) */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="mt-12 w-full max-w-4xl rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1F1F1F] p-4 sm:p-6 shadow-xl text-left"
        >
          {/* Window Frame Bar */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
              <span className="ml-2 font-mono text-neutral-500 dark:text-neutral-400">trusttracker.kachakaran.me</span>
            </div>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Realtime Sync
            </span>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#272727]">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Total Net Balance</span>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">$18,450.00</p>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 inline-block">
                +14.2% from last month
              </span>
            </div>
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#272727]">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Monthly Spending Pace</span>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">$3,840.00</p>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 inline-block">
                Target: $4,500.00 (On track)
              </span>
            </div>
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#272727]">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Shared Group Settlements</span>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-1">+$420.00</p>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 inline-block">
                3 roommates settled in full
              </span>
            </div>
          </div>

          {/* Realistic Recent Activity Sample */}
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">Recent Cashflow & Splits</h3>
              <span className="text-xs text-neutral-400">Showing latest verified entries</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-[#272727]/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    IN
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">Consulting Retainer Income</p>
                    <p className="text-xs text-neutral-500">Direct Deposit · Today, 10:30 AM</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+$4,200.00</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-[#272727]/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xs">
                    GRP
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200">Apartment High Speed Fiber</p>
                    <p className="text-xs text-neutral-500">Split 3 ways · Auto calculated</p>
                  </div>
                </div>
                <span className="font-bold text-neutral-900 dark:text-white">-$30.00 (Your 1/3 share)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. Mandatory Tagline Reveal Section (Rule B11) */}
      <section className="py-24 px-4 border-y border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1F1F1F]">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-4 block">
            Core Philosophy
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-snug [text-wrap:balance]">
            {taglineWords.map((word, idx) => (
              <TaglineWord key={idx} word={word} index={idx} />
            ))}
          </h2>
        </div>
      </section>

      {/* 4. Benefits Section (Outcome-Driven, Rule A5) */}
      <section id="benefits" className="py-24 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2 block">
            Built for Real Life
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight [text-wrap:balance]">
            Everything needed to master personal and shared finances
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 [text-wrap:pretty]">
            Eliminate guesswork with purpose built tools engineered for exact clarity and effortless collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1F1F1F] shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#272727] flex items-center justify-center mb-5">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-neutral-600 dark:text-neutral-300 leading-relaxed [text-wrap:pretty]">
                  {benefit.description}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-xs font-semibold text-primary-600 dark:text-primary-400">
                {benefit.metric}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. How It Works Section (3 Steps, Rule A2) */}
      <section id="how-it-works" className="py-24 px-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-[#181818]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2 block">
              Effortless Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight [text-wrap:balance]">
              Three simple steps to complete financial confidence
            </h2>
            <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 [text-wrap:pretty]">
              Get started in under two minutes with zero spreadsheet formulas required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1F1F1F] shadow-sm flex flex-col justify-between"
              >
                <div>
                  <span className="text-3xl font-extrabold text-neutral-300 dark:text-neutral-700 block mb-4">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed [text-wrap:pretty]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Social Proof & Organic Metrics (Rule B8) */}
      <section id="testimonials" className="py-24 px-4 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2 block">
            Real Results
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight [text-wrap:balance]">
            Trusted by households and professionals worldwide
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 [text-wrap:pretty]">
            See how real users organize their finances, settle group costs, and eliminate money friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1F1F1F] shadow-sm flex flex-col justify-between"
            >
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed italic mb-6">
                "{item.quote}"
              </p>
              <div>
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">{item.author}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.role}</p>
                  <span className="mt-2 inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    {item.saved}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FAQ Section (Accordion, Rule A2) */}
      <section id="faq" className="py-24 px-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1F1F1F]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-2 block">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight [text-wrap:balance]">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-base text-neutral-600 dark:text-neutral-300 [text-wrap:pretty]">
              Everything you need to know about Trust Tracker, group splitting, and security.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#272727]/50 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full py-4 px-5 text-left font-semibold text-neutral-900 dark:text-white flex items-center justify-between gap-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <span className="text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 transition-transform duration-300 ${
                      openFaqIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaqIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                      className="px-5 pb-4 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed [text-wrap:pretty]"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Final CTA Section (Rule A2, A5) */}
      <section className="py-24 px-4 max-w-5xl mx-auto text-center">
        <div className="p-8 sm:p-14 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-900 text-white dark:bg-[#131209] shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto [text-wrap:balance]">
            Take full command of your cashflow today
          </h2>
          <p className="mt-4 text-neutral-300 max-w-xl mx-auto text-base sm:text-lg [text-wrap:pretty]">
            Join over 14,800 individuals and households tracking expenses and splitting bills with zero spreadsheet headache.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-semibold text-base transition-all duration-200 inline-flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-semibold text-base transition-all duration-200 inline-flex items-center justify-center gap-2"
              >
                <span>Start tracking free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link
              to="/preview"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-neutral-700 hover:bg-neutral-800 active:scale-[0.98] text-neutral-200 font-semibold text-base transition-all duration-200 inline-flex items-center justify-center gap-2"
            >
              <span>Explore live demo</span>
            </Link>
          </div>

          <p className="mt-5 text-xs text-neutral-400">
            Free forever · No credit card required · Instant online setup
          </p>
        </div>
      </section>

      {/* 9. Semantic Footer (Rule B10) */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#181818] py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2.5">
            <img src="/icons/2.png" alt="Trust Tracker" className="w-6 h-6 rounded-md object-contain" />
            <span className="font-bold text-neutral-900 dark:text-white">Trust Tracker</span>
            <span className="text-xs">© 2026 Trust Tracker. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
            <a href="#benefits" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              How it works
            </a>
            <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              FAQ
            </a>
            <Link to="/login" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
