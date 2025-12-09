import React, { useState, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { useToast } from './Toast'
import { 
  TrendingUp, TrendingDown, Wallet, PlusCircle, 
  Calendar, Filter
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

const Dashboard = () => {
  const { familyMembers, categories, accounts, transactions, addTransaction, loading } = useData()
  const toast = useToast()

  const [filterOptions, setFilterOptions] = useState({
    startDate: '',
    endDate: '',
    period: 'monthly',
    familyMemberId: 'all'
  })

  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    familyMemberId: '',
    accountId: '',
    note: '',
    isRecurring: false,
    frequency: 'monthly'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    if (familyMembers.length > 0 && !newTransaction.familyMemberId) {
      setNewTransaction(prev => ({
        ...prev,
        familyMemberId: familyMembers[0].id.toString()
      }))
    }
  }, [familyMembers])

  const filteredTransactions = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let filtered = [...transactions]

    if (filterOptions.period === 'monthly') {
      filtered = filtered.filter(t => {
        const tDate = new Date(t.date)
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear
      })
    } else if (filterOptions.period === 'yearly') {
      filtered = filtered.filter(t => {
        const tDate = new Date(t.date)
        return tDate.getFullYear() === currentYear
      })
    } else if (filterOptions.startDate && filterOptions.endDate) {
      filtered = filtered.filter(t => {
        return t.date >= filterOptions.startDate && t.date <= filterOptions.endDate
      })
    }

    if (filterOptions.familyMemberId !== 'all') {
      filtered = filtered.filter(t => 
        t.family_member_id === parseInt(filterOptions.familyMemberId)
      )
    }

    return filtered
  }, [transactions, filterOptions])

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      income,
      expense,
      balance: income - expense
    }
  }, [filteredTransactions])

  const expensesByCategory = useMemo(() => {
    const grouped = {}
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        grouped[t.category] = (grouped[t.category] || 0) + t.amount
      })
    
    return Object.entries(grouped).map(([name, value]) => ({
      name,
      value
    }))
  }, [filteredTransactions])

  const availableAccounts = useMemo(() => {
    if (!newTransaction.familyMemberId) return []
    return accounts.filter(a => 
      a.family_member_id === parseInt(newTransaction.familyMemberId)
    )
  }, [accounts, newTransaction.familyMemberId])

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category || !newTransaction.accountId) {
      toast.error('נא למלא את כל השדות הנדרשים')
      return
    }

    setIsSubmitting(true)
    try {
      await addTransaction(newTransaction)
      toast.success('הפעולה נוספה בהצלחה!')
      
      setNewTransaction({
        type: 'expense',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        familyMemberId: newTransaction.familyMemberId,
        accountId: '',
        note: '',
        isRecurring: false,
        frequency: 'monthly'
      })
    } catch (error) {
      toast.error('שגיאה בהוספת הפעולה: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentCategories = newTransaction.type === 'expense' 
    ? categories.expense 
    : categories.income

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-semibold mb-1">הכנסות</p>
              <p className="text-2xl font-bold text-green-700">₪{summary.income.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-semibold mb-1">הוצאות</p>
              <p className="text-2xl font-bold text-red-700">₪{summary.expense.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-200 flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${summary.balance >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-red-50 to-red-100 border-red-200'} border-2 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold mb-1">מאזן</p>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                ₪{summary.balance.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full ${summary.balance >= 0 ? 'bg-emerald-200' : 'bg-red-200'} flex items-center justify-center`}>
              <Wallet className={summary.balance >= 0 ? 'text-emerald-600' : 'text-red-600'} size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-500" />
          <h3 className="text-lg font-bold text-gray-700">סינון תצוגה</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterOptions.period}
            onChange={(e) => setFilterOptions({ ...filterOptions, period: e.target.value })}
          >
            <option value="monthly">חודש נוכחי</option>
            <option value="yearly">שנה נוכחית</option>
            <option value="custom">תאריכים מותאמים</option>
          </select>

          {filterOptions.period === 'custom' && (
            <>
              <input
                type="date"
                className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                value={filterOptions.startDate}
                onChange={(e) => setFilterOptions({ ...filterOptions, startDate: e.target.value })}
              />
              <input
                type="date"
                className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                value={filterOptions.endDate}
                onChange={(e) => setFilterOptions({ ...filterOptions, endDate: e.target.value })}
              />
            </>
          )}

          <select
            className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterOptions.familyMemberId}
            onChange={(e) => setFilterOptions({ ...filterOptions, familyMemberId: e.target.value })}
          >
            <option value="all">כל המשתמשים</option>
            {familyMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
      </div>

      {expensesByCategory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-700 mb-4">התפלגות הוצאות לפי קטגוריות</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `₪${value.toLocaleString('he-IL', { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <PlusCircle size={20} className="text-blue-500" />
          <h3 className="text-lg font-bold text-gray-700">הוספה מהירה</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">סוג</label>
            <select
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              value={newTransaction.type}
              onChange={(e) => setNewTransaction({ 
                ...newTransaction, 
                type: e.target.value, 
                category: '' 
              })}
            >
              <option value="expense">הוצאה</option>
              <option value="income">הכנסה</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">סכום</label>
            <input
              type="number"
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              value={newTransaction.amount}
              onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">קטגוריה</label>
            <select
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              value={newTransaction.category}
              onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
            >
              <option value="">בחר קטגוריה</option>
              {currentCategories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">תאריך</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              value={newTransaction.date}
              onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">משתמש</label>
            <select
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              value={newTransaction.familyMemberId}
              onChange={(e) => setNewTransaction({ 
                ...newTransaction, 
                familyMemberId: e.target.value,
                accountId: ''
              })}
            >
              <option value="">בחר משתמש</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {newTransaction.type === 'income' ? 'יעד' : 'מקור'}
            </label>
            <select
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              value={newTransaction.accountId}
              onChange={(e) => setNewTransaction({ ...newTransaction, accountId: e.target.value })}
            >
              <option value="">בחר {newTransaction.type === 'income' ? 'יעד' : 'מקור'}</option>
              {availableAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">הערה (אופציונלי)</label>
            <input
              type="text"
              placeholder="הוסף הערה..."
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
              value={newTransaction.note}
              onChange={(e) => setNewTransaction({ ...newTransaction, note: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newTransaction.isRecurring}
                onChange={(e) => setNewTransaction({ ...newTransaction, isRecurring: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">פעולה קבועה</span>
            </label>

            {newTransaction.isRecurring && (
              <select
                className="border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                value={newTransaction.frequency}
                onChange={(e) => setNewTransaction({ ...newTransaction, frequency: e.target.value })}
              >
                <option value="daily">יומי</option>
                <option value="weekly">שבועי</option>
                <option value="monthly">חודשי</option>
                <option value="yearly">שנתי</option>
              </select>
            )}
          </div>
        </div>

        <button
          onClick={handleAddTransaction}
          disabled={isSubmitting}
          className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg py-3 font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
              מוסיף...
            </>
          ) : (
            <>
              <PlusCircle size={20} />
              הוסף פעולה
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default Dashboard
