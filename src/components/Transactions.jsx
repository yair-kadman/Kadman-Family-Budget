import React, { useState, useMemo } from 'react'
import { useData } from '../contexts/DataContext'
import { useToast } from './Toast'
import { 
  Edit2, Trash2, X, Check, Download, Filter,
  ArrowUpDown, ChevronUp, ChevronDown
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const Transactions = () => {
  const { 
    familyMembers, categories, accounts, transactions,
    updateTransaction, deleteTransaction, loading 
  } = useData()
  const toast = useToast()

  const [filterOptions, setFilterOptions] = useState({
    startDate: '',
    endDate: '',
    period: 'monthly',
    familyMemberId: 'all',
    category: 'all'
  })

  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
  const [editingId, setEditingId] = useState(null)
  const [editingTransaction, setEditingTransaction] = useState(null)

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

    if (filterOptions.category !== 'all') {
      filtered = filtered.filter(t => t.category === filterOptions.category)
    }

    return filtered
  }, [transactions, filterOptions])

  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      if (sortConfig.key === 'date') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (sortConfig.key === 'amount') {
        aVal = parseFloat(aVal)
        bVal = parseFloat(bVal)
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredTransactions, sortConfig])

  const expenses = sortedTransactions.filter(t => t.type === 'expense')
  const incomes = sortedTransactions.filter(t => t.type === 'income')

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="text-gray-400" />
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-blue-600" />
      : <ChevronDown size={14} className="text-blue-600" />
  }

  const startEdit = (transaction) => {
    setEditingId(transaction.id)
    setEditingTransaction({
      ...transaction,
      amount: transaction.amount.toString(),
      familyMemberId: transaction.family_member_id?.toString() || '',
      accountId: transaction.account_id?.toString() || ''
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingTransaction(null)
  }

  const saveEdit = async () => {
    if (!editingTransaction.amount || !editingTransaction.category) {
      toast.error('נא למלא את כל השדות')
      return
    }

    try {
      const original = transactions.find(t => t.id === editingId)
      await updateTransaction(editingId, editingTransaction, original)
      toast.success('העסקה עודכנה בהצלחה')
      cancelEdit()
    } catch (error) {
      toast.error('שגיאה בעדכון: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('האם למחוק את העסקה?')) return

    try {
      await deleteTransaction(id)
      toast.success('העסקה נמחקה')
    } catch (error) {
      toast.error('שגיאה במחיקה: ' + error.message)
    }
  }

  const exportToExcel = () => {
    const data = sortedTransactions.map(t => ({
      'תאריך': new Date(t.date).toLocaleDateString('he-IL'),
      'סוג': t.type === 'expense' ? 'הוצאה' : 'הכנסה',
      'קטגוריה': t.category,
      'סכום': t.amount,
      'משתמש': t.familyMemberName,
      'מקור/יעד': t.accountName,
      'הערה': t.note || '',
      'קבוע': t.is_recurring ? 'כן' : 'לא'
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'עסקאות')
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    saveAs(dataBlob, `תקציב_משפחתי_${new Date().toLocaleDateString('he-IL')}.xlsx`)
    toast.success('הקובץ יורד בהצלחה')
  }

  const getFamilyMemberColor = (memberId) => {
    const index = familyMembers.findIndex(m => m.id === memberId)
    return index === 0 ? 'bg-blue-500' : 'bg-pink-500'
  }

  const renderTable = (items, type) => {
    const isExpense = type === 'expense'
    const currentCategories = isExpense ? categories.expense : categories.income

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`px-5 py-4 border-b ${isExpense ? 'bg-red-50' : 'bg-green-50'}`}>
          <h3 className={`text-lg font-bold ${isExpense ? 'text-red-700' : 'text-green-700'}`}>
            {isExpense ? 'הוצאות' : 'הכנסות'}
            <span className="text-sm font-normal mr-2">
              ({items.length} פעולות, סה"כ ₪{items.reduce((s, t) => s + t.amount, 0).toLocaleString('he-IL')})
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">תאריך {getSortIcon('date')}</div>
                </th>
                <th className="p-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">קטגוריה {getSortIcon('category')}</div>
                </th>
                <th className="p-3 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('amount')}>
                  <div className="flex items-center gap-1">סכום {getSortIcon('amount')}</div>
                </th>
                <th className="p-3 text-right">משתמש</th>
                <th className="p-3 text-right">{isExpense ? 'מקור' : 'יעד'}</th>
                <th className="p-3 text-right">הערה</th>
                <th className="p-3 text-right">קבוע</th>
                <th className="p-3 text-right">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-400">אין נתונים להצגה</td>
                </tr>
              ) : items.map(t => {
                const isEditing = editingId === t.id

                if (isEditing) {
                  const editAccounts = accounts.filter(a => a.family_member_id === parseInt(editingTransaction.familyMemberId))

                  return (
                    <tr key={t.id} className="border-b bg-blue-50">
                      <td className="p-2">
                        <input type="date" value={editingTransaction.date} onChange={(e) => setEditingTransaction({...editingTransaction, date: e.target.value})} className="w-full border rounded p-1.5 text-sm" />
                      </td>
                      <td className="p-2">
                        <select value={editingTransaction.category} onChange={(e) => setEditingTransaction({...editingTransaction, category: e.target.value})} className="w-full border rounded p-1.5 text-sm">
                          {currentCategories.map(cat => (<option key={cat.id} value={cat.name}>{cat.name}</option>))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input type="number" value={editingTransaction.amount} onChange={(e) => setEditingTransaction({...editingTransaction, amount: e.target.value})} className="w-full border rounded p-1.5 text-sm" />
                      </td>
                      <td className="p-2">
                        <select value={editingTransaction.familyMemberId} onChange={(e) => setEditingTransaction({...editingTransaction, familyMemberId: e.target.value, accountId: ''})} className="w-full border rounded p-1.5 text-sm">
                          {familyMembers.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                        </select>
                      </td>
                      <td className="p-2">
                        <select value={editingTransaction.accountId} onChange={(e) => setEditingTransaction({...editingTransaction, accountId: e.target.value})} className="w-full border rounded p-1.5 text-sm">
                          <option value="">בחר</option>
                          {editAccounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input type="text" value={editingTransaction.note || ''} onChange={(e) => setEditingTransaction({...editingTransaction, note: e.target.value})} className="w-full border rounded p-1.5 text-sm" />
                      </td>
                      <td className="p-2 text-center">
                        <input type="checkbox" checked={editingTransaction.is_recurring || false} onChange={(e) => setEditingTransaction({...editingTransaction, is_recurring: e.target.checked, isRecurring: e.target.checked})} />
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <button onClick={saveEdit} className="p-1.5 rounded bg-green-100 text-green-600 hover:bg-green-200"><Check size={16} /></button>
                          <button onClick={cancelEdit} className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200"><X size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={t.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3">{new Date(t.date).toLocaleDateString('he-IL')}</td>
                    <td className="p-3">{t.category}</td>
                    <td className={`p-3 font-semibold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>₪{t.amount.toLocaleString('he-IL', { minimumFractionDigits: 2 })}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${getFamilyMemberColor(t.family_member_id)}`}></span>
                        {t.familyMemberName}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{t.accountName}</td>
                    <td className="p-3 text-xs text-gray-500 max-w-[150px] truncate">{t.note}</td>
                    <td className="p-3">
                      {t.is_recurring ? (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {t.frequency === 'daily' ? 'יומי' : t.frequency === 'weekly' ? 'שבועי' : t.frequency === 'monthly' ? 'חודשי' : 'שנתי'}
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(t)} className="p-1.5 rounded hover:bg-blue-100 text-blue-500"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded hover:bg-red-100 text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>
  }

  const allCategories = [...categories.expense, ...categories.income]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <h3 className="text-lg font-bold text-gray-700">סינון ומיון</h3>
          </div>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download size={18} />
            ייצוא לאקסל
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500" value={filterOptions.period} onChange={(e) => setFilterOptions({ ...filterOptions, period: e.target.value })}>
            <option value="monthly">חודש נוכחי</option>
            <option value="yearly">שנה נוכחית</option>
            <option value="all">הכל</option>
            <option value="custom">תאריכים מותאמים</option>
          </select>

          {filterOptions.period === 'custom' && (
            <>
              <input type="date" className="border border-gray-200 rounded-lg p-2.5 text-sm" value={filterOptions.startDate} onChange={(e) => setFilterOptions({ ...filterOptions, startDate: e.target.value })} />
              <input type="date" className="border border-gray-200 rounded-lg p-2.5 text-sm" value={filterOptions.endDate} onChange={(e) => setFilterOptions({ ...filterOptions, endDate: e.target.value })} />
            </>
          )}

          <select className="border border-gray-200 rounded-lg p-2.5 text-sm" value={filterOptions.familyMemberId} onChange={(e) => setFilterOptions({ ...filterOptions, familyMemberId: e.target.value })}>
            <option value="all">כל המשתמשים</option>
            {familyMembers.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
          </select>

          <select className="border border-gray-200 rounded-lg p-2.5 text-sm" value={filterOptions.category} onChange={(e) => setFilterOptions({ ...filterOptions, category: e.target.value })}>
            <option value="all">כל הקטגוריות</option>
            {allCategories.map(c => (<option key={c.id} value={c.name}>{c.name}</option>))}
          </select>
        </div>
      </div>

      {renderTable(expenses, 'expense')}
      {renderTable(incomes, 'income')}
    </div>
  )
}

export default Transactions
