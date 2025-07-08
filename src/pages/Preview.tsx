import TransactionsPDFReport from "../components/TransactionsPDFReport";

// Mock data for testing
const mockTransactions = [
  {
    id: "1",
    amount: 5000,
    type: "income",
    description: "Salary",
    date: "2025-06-01",
    category_id: "cat1",
  },
  {
    id: "2",
    amount: 1500,
    type: "expense",
    description: "Groceries",
    date: "2025-06-05",
    category_id: "cat2",
  },
];

const mockCategories = [
  {
    id: "cat1",
    name: "Job",
    icon: "💼",
    color: "#00B894",
    type: "income",
  },
  {
    id: "cat2",
    name: "Groceries",
    icon: "🛒",
    color: "#D63031",
    type: "expense",
  },
];

const mockUser = { full_name: "John Doe", email: "john@example.com" };
const mockDateRange = {
  start: "2025-01-01",
  end: "2025-07-01",
};

function Preview() {
  return (
    <div className="max-w-4xl mx-auto">
      <TransactionsPDFReport
        transactions={mockTransactions}
        categories={mockCategories}
        user={mockUser}
        dateRange={mockDateRange}
      />
    </div>
  );
}

export default Preview;
