import { Router, Response } from "express";
import { query } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Helper: Calculate EMI
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (tenureMonths <= 0) return principal;
  if (annualRate <= 0) {
    return Math.round((principal / tenureMonths) * 100) / 100;
  }
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi * 100) / 100;
}

export interface AmortizationEntry {
  paymentNumber: number;
  dueDate: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  remainingBalance: number;
}

// Helper: Generate Amortization Schedule
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startDateStr: string,
  emiDay: number = 1
): { emi: number; schedule: AmortizationEntry[] } {
  const schedule: AmortizationEntry[] = [];
  let remainingBalance = principal;
  const monthlyRate = annualRate > 0 ? annualRate / 12 / 100 : 0;
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const startDate = new Date(startDateStr);

  for (let month = 1; month <= tenureMonths; month++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + month - 1);
    dueDate.setDate(Math.min(emiDay, 28));

    const interestComponent = Math.round(remainingBalance * monthlyRate * 100) / 100;
    const principalComponent = Math.min(
      remainingBalance,
      Math.round((emi - interestComponent) * 100) / 100
    );
    remainingBalance = Math.max(0, Math.round((remainingBalance - principalComponent) * 100) / 100);

    schedule.push({
      paymentNumber: month,
      dueDate: dueDate.toISOString().slice(0, 10),
      emiAmount: emi,
      principalComponent,
      interestComponent,
      remainingBalance,
    });
  }

  return { emi, schedule };
}

// GET /api/loans - List all loans with progress & summaries
router.get("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const loansResult = await query(
      `SELECT l.*,
              COALESCE((SELECT SUM(amount) FROM loan_payments WHERE loan_id = l.id AND status = 'paid'), 0) as total_paid,
              COALESCE((SELECT COUNT(*) FROM loan_payments WHERE loan_id = l.id AND status = 'paid'), 0) as paid_installments
       FROM loans l
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );

    const loans = loansResult.rows.map((loan) => {
      const principal = parseFloat(loan.principal_amount);
      const interestRate = parseFloat(loan.interest_rate);
      const tenureMonths = parseInt(loan.tenure_months, 10);
      const totalPaid = parseFloat(loan.total_paid);
      const paidInstallments = parseInt(loan.paid_installments, 10);
      const monthlyEmi = parseFloat(loan.monthly_emi);

      const totalExpected = monthlyEmi * tenureMonths;
      const totalInterest = Math.max(0, totalExpected - principal);
      const remainingBalance = Math.max(0, totalExpected - totalPaid);
      const progressPercent = totalExpected > 0 ? Math.min(100, Math.round((totalPaid / totalExpected) * 100)) : 0;

      // Calculate next due date
      const startDate = new Date(loan.start_date);
      const nextDue = new Date(startDate);
      nextDue.setMonth(nextDue.getMonth() + paidInstallments);
      nextDue.setDate(Math.min(loan.emi_day || 1, 28));

      return {
        ...loan,
        principal_amount: principal,
        interest_rate: interestRate,
        tenure_months: tenureMonths,
        monthly_emi: monthlyEmi,
        total_paid: totalPaid,
        paid_installments: paidInstallments,
        total_expected: Math.round(totalExpected * 100) / 100,
        total_interest: Math.round(totalInterest * 100) / 100,
        remaining_balance: Math.round(remainingBalance * 100) / 100,
        progress_percent: progressPercent,
        next_due_date: nextDue.toISOString().slice(0, 10),
      };
    });

    // Summary calculations
    const borrowedLoans = loans.filter((l) => l.type === "borrowed" && l.status === "active");
    const lentLoans = loans.filter((l) => l.type === "lent" && l.status === "active");

    const summary = {
      totalBorrowedPrincipal: borrowedLoans.reduce((sum, l) => sum + l.principal_amount, 0),
      totalBorrowedRemaining: borrowedLoans.reduce((sum, l) => sum + l.remaining_balance, 0),
      monthlyEmiBurden: borrowedLoans.reduce((sum, l) => sum + l.monthly_emi, 0),
      totalLentPrincipal: lentLoans.reduce((sum, l) => sum + l.principal_amount, 0),
      totalLentRemaining: lentLoans.reduce((sum, l) => sum + l.remaining_balance, 0),
      monthlyLentReceivable: lentLoans.reduce((sum, l) => sum + l.monthly_emi, 0),
      activeLoansCount: loans.filter((l) => l.status === "active").length,
    };

    res.json({ loans, summary });
  } catch (err) {
    console.error("Fetch loans error:", err);
    res.status(500).json({ error: "Failed to fetch loans." });
  }
});

// POST /api/loans - Create new loan
router.post("/", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      type,
      counterparty,
      principal_amount,
      interest_rate = 0,
      tenure_months,
      start_date,
      emi_day = 1,
      currency = "USD",
      monthly_emi,
      notes = "",
    } = req.body;

    if (!name || !counterparty || !principal_amount || !tenure_months || !start_date) {
      res.status(400).json({ error: "Missing required loan fields." });
      return;
    }

    const principal = parseFloat(principal_amount);
    const rate = parseFloat(interest_rate) || 0;
    const tenure = parseInt(tenure_months, 10);

    const calculatedEmi = monthly_emi && parseFloat(monthly_emi) > 0
      ? parseFloat(monthly_emi)
      : calculateEMI(principal, rate, tenure);

    const result = await query(
      `INSERT INTO loans (user_id, name, type, counterparty, principal_amount, interest_rate, tenure_months, start_date, emi_day, monthly_emi, currency, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12)
       RETURNING *`,
      [
        userId,
        name.trim(),
        type || "borrowed",
        counterparty.trim(),
        principal,
        rate,
        tenure,
        start_date,
        parseInt(emi_day, 10) || 1,
        calculatedEmi,
        currency,
        notes,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create loan error:", err);
    res.status(500).json({ error: "Failed to create loan." });
  }
});

// GET /api/loans/:id - Get loan with amortization schedule & payments
router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const loanResult = await query(
      "SELECT * FROM loans WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (loanResult.rows.length === 0) {
      res.status(404).json({ error: "Loan not found." });
      return;
    }

    const loan = loanResult.rows[0];
    const principal = parseFloat(loan.principal_amount);
    const rate = parseFloat(loan.interest_rate);
    const tenure = parseInt(loan.tenure_months, 10);

    const paymentsResult = await query(
      "SELECT * FROM loan_payments WHERE loan_id = $1 ORDER BY payment_number ASC, payment_date ASC",
      [id]
    );

    const payments = paymentsResult.rows.map((p) => ({
      ...p,
      amount: parseFloat(p.amount),
      principal_component: parseFloat(p.principal_component),
      interest_component: parseFloat(p.interest_component),
    }));

    const { emi, schedule } = generateAmortizationSchedule(
      principal,
      rate,
      tenure,
      loan.start_date,
      loan.emi_day
    );

    // Merge payment status into schedule
    const scheduleWithPayments = schedule.map((item) => {
      const recordedPayment = payments.find((p) => p.payment_number === item.paymentNumber);
      return {
        ...item,
        isPaid: !!recordedPayment && recordedPayment.status === "paid",
        paymentId: recordedPayment?.id || null,
        paidDate: recordedPayment?.payment_date || null,
        paidAmount: recordedPayment?.amount || null,
      };
    });

    res.json({
      loan: {
        ...loan,
        principal_amount: principal,
        interest_rate: rate,
        tenure_months: tenure,
        monthly_emi: parseFloat(loan.monthly_emi),
      },
      schedule: scheduleWithPayments,
      payments,
    });
  } catch (err) {
    console.error("Fetch loan details error:", err);
    res.status(500).json({ error: "Failed to fetch loan details." });
  }
});

// POST /api/loans/:id/pay - Record an EMI payment
router.post("/:id/pay", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { payment_number, amount, payment_date, notes = "", record_in_transactions = false } = req.body;

    const loanCheck = await query("SELECT * FROM loans WHERE id = $1 AND user_id = $2", [id, userId]);
    if (loanCheck.rows.length === 0) {
      res.status(404).json({ error: "Loan not found." });
      return;
    }

    const loan = loanCheck.rows[0];
    const payAmount = parseFloat(amount) || parseFloat(loan.monthly_emi);
    const date = payment_date ? new Date(payment_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    // Determine payment number
    let pNum = payment_number;
    if (!pNum) {
      const countRes = await query("SELECT COUNT(*) as count FROM loan_payments WHERE loan_id = $1", [id]);
      pNum = parseInt(countRes.rows[0].count, 10) + 1;
    }

    const result = await query(
      `INSERT INTO loan_payments (loan_id, payment_number, amount, payment_date, status, notes)
       VALUES ($1, $2, $3, $4, 'paid', $5)
       RETURNING *`,
      [id, pNum, payAmount, date, notes]
    );

    // If requested, optionally record an entry in general transactions table
    if (record_in_transactions) {
      const txType = loan.type === "borrowed" ? "expense" : "income";
      const txDesc = `Loan EMI (${loan.name} - Installment #${pNum})`;
      await query(
        `INSERT INTO transactions (user_id, amount, type, description, date)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, payAmount, txType, txDesc, date]
      );
    }

    // Check if fully paid
    const totalPaidRes = await query("SELECT SUM(amount) as total FROM loan_payments WHERE loan_id = $1 AND status = 'paid'", [id]);
    const totalPaid = parseFloat(totalPaidRes.rows[0].total || 0);
    const totalExpected = parseFloat(loan.monthly_emi) * parseInt(loan.tenure_months, 10);

    if (totalPaid >= totalExpected) {
      await query("UPDATE loans SET status = 'closed' WHERE id = $1", [id]);
    }

    res.status(201).json({
      message: "Payment recorded successfully",
      payment: result.rows[0],
    });
  } catch (err) {
    console.error("Pay EMI error:", err);
    res.status(500).json({ error: "Failed to record payment." });
  }
});

// DELETE /api/loans/:id - Delete loan
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = await query("DELETE FROM loans WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Loan not found." });
      return;
    }

    res.json({ message: "Loan deleted successfully." });
  } catch (err) {
    console.error("Delete loan error:", err);
    res.status(500).json({ error: "Failed to delete loan." });
  }
});

export default router;
