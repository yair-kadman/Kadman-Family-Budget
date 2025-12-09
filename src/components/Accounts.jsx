import React, { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useToast } from './Toast'
import { 
  Plus, Edit2, Trash2, X, Check, 
  Wallet, CreditCard, Banknote, Smartphone
} from 'lucide-react'

const Accounts = () => {
  const { familyMembers, accounts, addAccount, updateAccount, deleteAccount, loading } = useData()
  const toast = useToast()

  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountMember, setNewAccountMember] = useState('')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingData, setEditingData] = useState({ name: '', balance: '' })

  React.useEffect(() => {
    if (familyMembers.length > 0 && !newAccountMember) {
      setNewAccountMember(familyMembers[0].id.toString())
    }
  }, [familyMembers])

  const handleAdd = async () => {
    if (!newAccountName.trim() || !newAccountMember) {
      toast.error('נא למלא את כל השדות')
      return
    }

    setIsAdding(true)
    try {
      await addAccount(
        newAccountName.trim(),
        parseInt(newAccountMember),
        parseFloat(newAccountBalance) || 0
      )
      toast.success('המקור הכספי נוסף בהצלחה')
      setNewAccountName('')
      setNewAccountBalance('')
    } catch (error) {
      toast.error('שגיאה בהוספה: ' + error.message)
    } finally {
      setIsAdding(false)
    }
  }

  const startEdit = (account) => {
    setEditingId(account.id)
    setEditingData({
      name: account.name,
      balance: account.balance?.toString() || '0'
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingData({ name: '', balance: '' })
  }

  const saveEdit = async (id) => {
    if (!editingData.name.trim()) {
      toast.error('נא להזין שם')
      return
    }

    try {
      await updateAccount(id, {
        name: editingData.name.trim(),
        balance: parseFloat(editingData.balance) || 0
      })
      toast.success('המקור הכספי עודכן')
      cancelEdit()
    } catch (error) {
      toast.error('שגיאה בעדכון: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('האם למחוק את המקור הכספי?')) return

    try {
      await deleteAccount(id)
      toast.success('המקור הכספי נמחק')
    } catch (error) {
      toast.error('שגיאה במחיקה: ' + error.message)
    }
  }

  const getAccountIcon = (name) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('בנק') || lowerName.includes('bank')) return <Banknote size={20} />
    if (lowerName.includes('אשראי') || lowerName.includes('credit')) return <CreditCard size={20} />
    if (lowerName.includes('bit') || lowerName.includes('paybox') || lowerName.includes('ביט')) return <Smartphone size={20} />
    return <Wallet size={20} />
  }

  const getMemberColor = (memberId) => {
    const index = familyMembers.findIndex(m => m.id === memberId)
    return index === 0 ? 'blue' : 'pink'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  const groupedAccounts = familyMembers.map(member => ({
    member,
    accounts: accounts.filter(a => a.family_member_id === member.id)
  }))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-blue-500" />
          הוספת מקור כספי חדש
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="שם המקור (למשל: חשבון בנק)"
            className="border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={newAccountMember}
            onChange={(e) => setNewAccountMember(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">בחר משתמש</option>
            {familyMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>

          <input
            type="number"
            value={newAccountBalance}
            onChange={(e) => setNewAccountBalance(e.target.value)}
            placeholder="יתרה התחלתית"
            className="border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <>
                <span className="spinner"></span>
                מוסיף...
              </>
            ) : (
              <>
                <Plus size={20} />
                הוסף
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groupedAccounts.map(({ member, accounts: memberAccounts }) => {
          const color = getMemberColor(member.id)
          const totalBalance = memberAccounts.reduce((sum, a) => sum + (a.balance || 0), 0)

          return (
            <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`px-5 py-4 border-b ${color === 'blue' ? 'bg-blue-50' : 'bg-pink-50'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-bold ${color === 'blue' ? 'text-blue-700' : 'text-pink-700'} flex items-center gap-2`}>
                    <span className={`w-3 h-3 rounded-full ${color === 'blue' ? 'bg-blue-500' : 'bg-pink-500'}`}></span>
                    {member.name}
                    <span className="text-sm font-normal">({memberAccounts.length} מקורות)</span>
                  </h3>
                  <span className={`font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    סה"כ: ₪{totalBalance.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-4">
                {memberAccounts.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">אין מקורות כספיים</p>
                ) : (
                  <div className="space-y-3">
                    {memberAccounts.map(account => (
                      <div
                        key={account.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                      >
                        <div className={`p-2 rounded-lg ${color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                          {getAccountIcon(account.name)}
                        </div>

                        {editingId === account.id ? (
                          <>
                            <input
                              type="text"
                              value={editingData.name}
                              onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                              className="flex-1 border border-blue-300 rounded-lg px-3 py-1.5"
                            />
                            <input
                              type="number"
                              value={editingData.balance}
                              onChange={(e) => setEditingData({ ...editingData, balance: e.target.value })}
                              className="w-28 border border-blue-300 rounded-lg px-3 py-1.5"
                            />
                            <button
                              onClick={() => saveEdit(account.id)}
                              className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1">
                              <p className="font-medium text-gray-700">{account.name}</p>
                            </div>
                            <p className={`font-bold ${(account.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₪{(account.balance || 0).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                            </p>
                            <button
                              onClick={() => startEdit(account)}
                              className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(account.id)}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Accounts
