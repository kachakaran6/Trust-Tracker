import React, { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useCategories } from '../contexts/CategoriesContext';
import { format, addMonths } from 'date-fns';
import { PlusCircle, AlertTriangle, Check } from 'lucide-react';

function Budget() {
  const { budgets, addBudget, getBudgetSummary } = useBudget();
  const { getExpenseCategories } = useCategories();
  
  // State for adding new budget
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState({
    categoryId: '',
    amount: '',
    month: format(new Date(), 'yyyy-MM')
  });
  
  // Get categories and budget data
  const expenseCategories = getExpenseCategories();
  const currentMonth = format(new Date(), 'yyyy-MM');
  const nextMonth = format(addMonths(new Date(), 1), 'yyyy-MM');
  
  // Get budget summaries
  const currentMonthSummary = getBudgetSummary(currentMonth);
  const nextMonthSummary = getBudgetSummary(nextMonth);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(newBudget.amount);
    if (isNaN(amount) || amount <= 0) return;
    
    addBudget({
      categoryId: newBudget.categoryId,
      amount,
      month: newBudget.month
    });
    
    // Reset form
    setNewBudget({
      categoryId: '',
      amount: '',
      month: format(new Date(), 'yyyy-MM')
    });
    
    setIsAddingBudget(false);
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewBudget(prev => ({ ...prev, [name]: value }));
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format percentage
  const formatPercentage = (value: number) => {
    return Math.round(value) + '%';
  };
  
  // Get status color based on percentage
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-danger-500';
    if (percentage >= 75) return 'bg-warning-500';
    return 'bg-success-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Budget Planning</h1>
        <button
          onClick={() => setIsAddingBudget(true)}
          className="btn-primary"
        >
          <PlusCircle size={16} className="mr-1" />
          Add Budget
        </button>
      </div>
      
      {/* Add Budget Form (Modal) */}
      {isAddingBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 animate-slide-up">
            <h2 className="text-xl font-semibold mb-4">Add New Budget</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="categoryId" className="form-label">Category</label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    className="select-field"
                    value={newBudget.categoryId}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a category</option>
                    {expenseCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="amount" className="form-label">Budget Amount</label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    step="1"
                    required
                    className="input-field"
                    placeholder="0"
                    value={newBudget.amount}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label htmlFor="month" className="form-label">Month</label>
                  <select
                    id="month"
                    name="month"
                    required
                    className="select-field"
                    value={newBudget.month}
                    onChange={handleInputChange}
                  >
                    <option value={currentMonth}>
                      {format(new Date(currentMonth + '-01'), 'MMMM yyyy')} (Current)
                    </option>
                    <option value={nextMonth}>
                      {format(new Date(nextMonth + '-01'), 'MMMM yyyy')} (Next)
                    </option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingBudget(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Month tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button className="py-3 px-6 border-b-2 border-primary-500 text-primary-600 font-medium">
          Current Month
        </button>
        <button className="py-3 px-6 text-gray-500 hover:text-gray-700">
          Next Month
        </button>
      </div>
      
      {/* Overall progress */}
      <div className="card p-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Overall Budget</h2>
            <p className="text-sm text-gray-500">
              Month of {format(new Date(currentMonth + '-01'), 'MMMM yyyy')}
            </p>
          </div>
          <div className="mt-2 md:mt-0 flex items-center">
            <p className="text-lg font-semibold">
              {formatCurrency(currentMonthSummary.totalSpent)} / {formatCurrency(currentMonthSummary.totalBudget)}
            </p>
          </div>
        </div>
        
        <div className="relative pt-1">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm">
              <span className="font-semibold text-gray-700">{formatPercentage(currentMonthSummary.percentage)}</span> used
            </div>
            <div className="text-sm text-right">
              <span className="font-semibold text-gray-700">{formatCurrency(currentMonthSummary.remaining)}</span> remaining
            </div>
          </div>
          <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-200">
            <div
              style={{ width: `${Math.min(currentMonthSummary.percentage, 100)}%` }}
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                getStatusColor(currentMonthSummary.percentage)
              }`}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Category budgets */}
      <div className="animate-slide-up">
        <h2 className="text-lg font-semibold mb-4">Category Budgets</h2>
        
        {Object.keys(currentMonthSummary.categories).length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-gray-500">No budgets set for this month.</p>
            <button 
              onClick={() => setIsAddingBudget(true)}
              className="btn-outline mt-4"
            >
              <PlusCircle size={16} className="mr-1" />
              Add Your First Budget
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {Object.entries(currentMonthSummary.categories).map(([categoryId, data]) => {
              const category = expenseCategories.find(cat => cat.id === categoryId);
              if (!category) return null;
              
              return (
                <div key={categoryId} className="card p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                        style={{ backgroundColor: category.color + '20', color: category.color }}
                      >
                        <span className="font-bold text-lg">{category.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(data.spent)} of {formatCurrency(data.budget)} used
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 md:mt-0">
                      {data.percentage >= 90 ? (
                        <div className="px-3 py-1 bg-danger-50 text-danger-700 rounded-full text-xs flex items-center">
                          <AlertTriangle size={12} className="mr-1" />
                          Limit reached
                        </div>
                      ) : data.percentage < 50 ? (
                        <div className="px-3 py-1 bg-success-50 text-success-700 rounded-full text-xs flex items-center">
                          <Check size={12} className="mr-1" />
                          On track
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-warning-50 text-warning-700 rounded-full text-xs">
                          {formatCurrency(data.remaining)} left
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 mb-1 text-xs flex rounded-full bg-gray-200">
                      <div
                        style={{ width: `${Math.min(data.percentage, 100)}%` }}
                        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                          getStatusColor(data.percentage)
                        }`}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div>{formatPercentage(data.percentage)} used</div>
                      <div>{formatCurrency(data.remaining)} remaining</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Budget tips */}
      <div className="card p-6 bg-primary-50 border border-primary-100 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-lg font-semibold mb-3">Budgeting Tips</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <Check size={16} className="text-primary-600 mr-2 mt-0.5" />
            <span>Set realistic budget goals based on your historical spending patterns.</span>
          </li>
          <li className="flex items-start">
            <Check size={16} className="text-primary-600 mr-2 mt-0.5" />
            <span>Try the 50/30/20 rule: Spend 50% on needs, 30% on wants, and save 20%.</span>
          </li>
          <li className="flex items-start">
            <Check size={16} className="text-primary-600 mr-2 mt-0.5" />
            <span>Review and adjust your budgets regularly as your financial situation changes.</span>
          </li>
          <li className="flex items-start">
            <Check size={16} className="text-primary-600 mr-2 mt-0.5" />
            <span>Plan for irregular expenses like holidays, vacations, and annual subscriptions.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Budget;