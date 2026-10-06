import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Icons } from "../components/ui/icons";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const features = [
    {
      icon: <Icons.Transactions size={20} />,
      title: "Transactions & Categories",
      description:
        "Record daily income and expenses with customizable categories, date filters, and clean signed cashflow totals.",
    },
    {
      icon: <Icons.Budget size={20} />,
      title: "Budgets & Spending Limits",
      description:
        "Set category-level limits with real-time progress bars and early warnings before you exceed your threshold.",
    },
    {
      icon: <Icons.Groups size={20} />,
      title: "Group Expense Splitting",
      description:
        "Split rent, dinners, and group trips with automated debt minimization and in-place ledger reimbursements.",
    },
    {
      icon: <Icons.Loans size={20} />,
      title: "Loans & EMI Calculator",
      description:
        "Track borrowed and lent funds with interactive EMI simulators, payoff tracking, and amortization schedules.",
    },
    {
      icon: <Icons.Subscriptions size={20} />,
      title: "Subscription Tracker",
      description:
        "Monitor recurring SaaS tools, digital memberships, and trial periods with upcoming renewal alerts.",
    },
    {
      icon: <Icons.Debts size={20} />,
      title: "Debts & Lender Ledger",
      description:
        "Keep a transparent ledger of peer-to-peer loans with payment history and one-click repayment reminders.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Add your income and expenses",
      description:
        "Quickly log cashflow, recurring bills, or peer debts with clean category tags and currency formatting.",
    },
    {
      number: "02",
      title: "Set budgets and create groups",
      description:
        "Define spending limits and invite friends or flatmates with a single invite link or code.",
    },
    {
      number: "03",
      title: "See insights and settle up",
      description:
        "Monitor net cashflow, check spending forecasts, and settle group balances in minimum transactions.",
    },
  ];

  const faqs = [
    {
      question: "Is TrustTracker free to use?",
      answer:
        "Yes, TrustTracker is free to use with all core features included: expense tracking, group splits, loan schedules, subscription management, and budget alerts.",
    },
    {
      question: "Is my financial data private?",
      answer:
        "Yes. Your data belongs entirely to you. We do not sell your personal financial records or run third-party advertising trackers.",
    },
    {
      question: "How does group expense splitting work?",
      answer:
        "When someone pays for a group expense, TrustTracker calculates everyone's split share. When a member settles their share, the payer's personal expense is automatically deducted in-place to keep personal reports accurate.",
    },
    {
      question: "Can I track loans and calculate EMIs?",
      answer:
        "Yes. The loans module includes a real-time EMI simulator, monthly breakdown, payoff progress, and amortization schedule generation.",
    },
    {
      question: "Can I export my financial data?",
      answer:
        "Yes. You can export your transaction history and reports to Excel and PDF formats anytime.",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 font-semibold text-lg text-[var(--text)]">
              <div className="w-8 h-8 rounded-md bg-[var(--primary)] flex items-center justify-center text-white">
                <Icons.Shield size={18} />
              </div>
              <span>TrustTracker</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-muted)]">
            <a href="#features" className="hover:text-[var(--text)] transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[var(--text)] transition">
              How It Works
            </a>
            <a href="#faq" className="hover:text-[var(--text)] transition">
              FAQ
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/register")}
                >
                  Get started
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
            >
              {mobileMenuOpen ? <Icons.Close size={20} /> : <Icons.Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] py-1"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] py-1"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] py-1"
            >
              FAQ
            </a>
            <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2">
              {user ? (
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/dashboard");
                  }}
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full justify-center"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/register");
                    }}
                  >
                    Get started
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[var(--text)] leading-tight">
          Track every rupee. Split every bill.
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
          TrustTracker is a personal finance tracker with budgets, shared group expenses, loans, and subscriptions in one place.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {user ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate("/dashboard")}
              icon={<Icons.Forward size={18} />}
            >
              Launch Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate("/register")}
                icon={<Icons.Forward size={18} />}
              >
                Get started
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/login")}
              >
                Sign in
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          Free to use · No credit card required
        </p>

        {/* Product UI Preview Mockup */}
        <div className="pt-8">
          <Card className="p-4 sm:p-6 text-left space-y-4 border border-[var(--border)] shadow-sm bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[var(--text)]">Dashboard Overview</span>
                <Badge variant="success">All Systems Active</Badge>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-mono">OCTOBER 2026</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-md bg-[var(--surface-muted)] border border-[var(--border)]">
                <span className="text-xs text-[var(--text-muted)]">Total Balance</span>
                <p className="text-lg font-semibold text-[var(--text)] tabular-nums mt-0.5">₹48,500.00</p>
              </div>
              <div className="p-3 rounded-md bg-[var(--surface-muted)] border border-[var(--border)]">
                <span className="text-xs text-[var(--text-muted)]">Monthly Income</span>
                <p className="text-lg font-semibold text-[var(--success)] tabular-nums mt-0.5">+₹75,000.00</p>
              </div>
              <div className="p-3 rounded-md bg-[var(--surface-muted)] border border-[var(--border)]">
                <span className="text-xs text-[var(--text-muted)]">Monthly Expenses</span>
                <p className="text-lg font-semibold text-[var(--danger)] tabular-nums mt-0.5">-₹26,500.00</p>
              </div>
              <div className="p-3 rounded-md bg-[var(--surface-muted)] border border-[var(--border)]">
                <span className="text-xs text-[var(--text-muted)]">Group Settlements</span>
                <p className="text-lg font-semibold text-[var(--primary)] tabular-nums mt-0.5">₹1,240.00</p>
              </div>
            </div>

            <div className="p-3 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-sm bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center font-semibold">
                  G
                </div>
                <span className="font-medium text-[var(--text)]">Groceries & Supermarket</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[var(--text-muted)]">Today, 2:30 PM</span>
                <span className="font-semibold text-[var(--danger)] tabular-nums">-₹1,420.00</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-20 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text)]">
              Everything you need for complete money clarity
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Designed from the ground up to replace spreadsheets and fragmented budgeting apps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-md bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-[var(--text)]">{f.title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {f.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text)]">
            How TrustTracker works
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Three simple steps to maintain an organized personal and shared ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <Card key={s.number} className="p-6 space-y-3">
              <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--primary-subtle)] px-2.5 py-1 rounded-md inline-block">
                STEP {s.number}
              </span>
              <h3 className="text-base font-semibold text-[var(--text)]">{s.title}</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {s.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-16 sm:py-20 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text)]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Common questions about features, privacy, and data tracking.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <Card
                  key={faq.question}
                  className="p-5 cursor-pointer transition-colors"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-sm text-[var(--text)]">
                      {faq.question}
                    </h3>
                    <Icons.Expand
                      size={16}
                      className={`text-[var(--text-muted)] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {isOpen && (
                    <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] pt-3">
                      {faq.answer}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Strip */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--text)]">
          Ready to take control of your finances?
        </h2>
        <p className="text-sm text-[var(--text-muted)] max-w-xl mx-auto">
          Start tracking expenses, splitting bills, and managing budgets with TrustTracker today.
        </p>
        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/register")}
            icon={<Icons.Forward size={18} />}
          >
            Get started with TrustTracker
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2 font-semibold text-sm text-[var(--text)]">
            <div className="w-6 h-6 rounded-sm bg-[var(--primary)] flex items-center justify-center text-white">
              <Icons.Shield size={14} />
            </div>
            <span>TrustTracker</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-[var(--text)] transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[var(--text)] transition">
              How It Works
            </a>
            <a href="#faq" className="hover:text-[var(--text)] transition">
              FAQ
            </a>
            <Link to="/login" className="hover:text-[var(--text)] transition">
              Sign In
            </Link>
          </div>

          <p>© 2026 TrustTracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
