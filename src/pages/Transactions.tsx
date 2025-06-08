import React, { useState } from 'react';
import { useTransactions } from '../contexts/TransactionsContext';
import { useCategories } from '../contexts/CategoriesContext';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Filter, Plus, Search, CreditCard, DollarSign, Calendar, Tag, AlignLeft, ArrowDown, ArrowUp } from 'lucide-react';

type SortField = 'date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

function Transactions() {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const { categories } = useCategories();
  
  // State for adding new transaction
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category_id: '',
    type: 'expense' as 'income' | 'expense',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  
  // State for filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Function to handle adding a new transaction
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount) || amount <= 0) return;
    
    addTransaction({
      amount,
      category_id: newTransaction.category_id,
      description: newTransaction.description,
      date: newTransaction.date,
      type: newTransaction.type
    });
    
    // Reset form
    setNewTransaction({
      description: '',
      amount: '',
      category_id: '',
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd')
    });
    
    setShowAddForm(false);
  };
  
  // Function to handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({ ...prev, [name]: value }));
  };
  
  // Function to filter transactions
  const filterTransactions = () => {
    return transactions.filter(transaction => {
      // Search term filter
      if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (categoryFilter && transaction.category_id !== categoryFilter) {
        return false;
      }
      
      // Type filter
      if (typeFilter && transaction.type !== typeFilter) {
        return false;
      }
      
      // Date filter
      if (dateFilter) {
        const date = parseISO(transaction.date);
        let filterStart, filterEnd;
        
        switch (dateFilter) {
          case 'this-month':
            filterStart = startOfMonth(new Date());
            filterEnd = endOfMonth(new Date());
            break;
          case 'last-month':
            filterStart = startOfMonth(subMonths(new Date(), 1));
            filterEnd = endOfMonth(subMonths(new Date(), 1));
            break;
          case 'last-3-months':
            filterStart = startOfMonth(subMonths(new Date(), 2));
            filterEnd = endOfMonth(new Date());
            break;
          default:
            return true;
        }
        
        if (date < filterStart || date > filterEnd) {
          return false;
        }
      }
      
      return true;
    });
  };
  
  // Function to sort transactions
  const sortTransactions = (filteredTransactions: typeof transactions) => {
    return [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          const categoryA = categories.find(cat => cat.id === a.category_id)?.name || '';
          const categoryB = categories.find(cat => cat.id === b.category_id)?.name || '';
          comparison = categoryA.localeCompare(categoryB);
          break;
        default:
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };
  
  // Get filtered and sorted transactions
  const filteredTransactions = filterTransactions();
  const sortedTransactions = sortTransactions(filteredTransactions);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Function to toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Function to get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>
      
      {/* Add Transaction Form (Modal) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 animate-slide-up">
            <h2 className="text-xl font-semibold mb-4">Add New Transaction</h2>
            
            <form onSubmit={handleAddTransaction}>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Transaction Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setNewTransaction(prev => ({ ...prev, type: 'expense' }))}
                      className={`p-3 rounded-lg border ${
                        newTransaction.type === 'expense' 
                          ? 'border-primary-500 bg-primary-50 text-primary-700' 
                          : 'border-gray-300 text-gray-700'
                      } flex items-center justify-center`}
                    >
                      <ArrowDown size={16} className="mr-2" />
                      Expense
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setNewTransaction(prev => ({ ...prev, type: 'income' }))}
                      className={`p-3 rounded-lg border ${
                        newTransaction.type === 'income' 
                          ? 'border-success-500 bg-success-50 text-success-700' 
                          : 'border-gray-300 text-gray-700'
                      } flex items-center justify-center`}
                    >
                      <ArrowUp size={16} className="mr-2" />
                      Income
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="form-label">Description</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AlignLeft size={16} className="text-gray-400" />
                    </div>
                    <input
                      id="description"
                      name="description"
                      type="text"
                      required
                      className="input-field pl-10"
                      placeholder="What was this for?"
                      value={newTransaction.description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="amount" className="form-label">Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className="text-gray-400" />
                    </div>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      className="input-field pl-10"
                      placeholder="0.00"
                      value={newTransaction.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="category_id" className="form-label">Category</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag size={16} className="text-gray-400" />
                    </div>
                    <select
                      id="category_id"
                      name="category_id"
                      required
                      className="select-field pl-10 appearance-none"
                      value={newTransaction.category_id}
                      onChange={handleInputChange}
                    >
                      <option value="">Select a category</option>
                      {categories
                        .filter(cat => cat.type === newTransaction.type)
                        .map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ArrowDown size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="date" className="form-label">Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar size={16} className="text-gray-400" />
                    </div>
                    <input
                      id="date"
                      name="date"
                      type="date"
                      required
                      className="input-field pl-10"
                      value={newTransaction.date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Filters and Search */}
      <div className="card p-4 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag size={18} className="text-gray-400" />
            </div>
            <select
              className="select-field pl-10 appearance-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ArrowDown size={16} className="text-gray-400" />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CreditCard size={18} className="text-gray-400" />
            </div>
            <select
              className="select-field pl-10 appearance-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ArrowDown size={16} className="text-gray-400" />
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <select
              className="select-field pl-10 appearance-none"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ArrowDown size={16} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Transactions Table */}
      <div className="card overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('category')}
                >
                  <div className="flex items-center">
                    Category
                    {sortField === 'category' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {sortField === 'date' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => toggleSort('amount')}
                >
                  <div className="flex items-center justify-end">
                    Amount
                    {sortField === 'amount' && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          <CreditCard size={16} />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                          <div className="text-xs text-gray-500">{transaction.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {getCategoryName(transaction.category_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(parseISO(transaction.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Transactions;