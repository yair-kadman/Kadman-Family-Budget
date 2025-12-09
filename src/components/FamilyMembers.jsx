import React, { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useToast } from './Toast'
import { Plus, Edit2, Trash2, X, Check, Users, User } from 'lucide-react'

const FamilyMembers = () => {
  const { familyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember, loading } = useData()
  const toast = useToast()

  const [newMemberName, setNewMemberName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')

  const handleAdd = async () => {
    if (!newMemberName.trim()) {
      toast.error('נא להזין שם')
      return
    }

    setIsAdding(true)
    try {
      await addFamilyMember(newMemberName.trim())
      toast.success('חבר המשפחה נוסף בהצלחה')
      setNewMemberName('')
    } catch (error) {
      toast.error('שגיאה בהוספה: ' + error.message)
    } finally {
      setIsAdding(false)
    }
  }

  const startEdit = (member) => {
    setEditingId(member.id)
    setEditingName(member.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const saveEdit = async (id) => {
    if (!editingName.trim()) {
      toast.error('נא להזין שם')
      return
    }

    try {
      await updateFamilyMember(id, editingName.trim())
      toast.success('השם עודכן בהצלחה')
      cancelEdit()
    } catch (error) {
      toast.error('שגיאה בעדכון: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (familyMembers.length <= 1) {
      toast.error('חייב להישאר לפחות חבר משפחה אחד')
      return
    }

    if (!confirm('האם למחוק את חבר המשפחה? פעולה זו תמחק גם את כל המקורות הכספיים שלו.')) return

    try {
      await deleteFamilyMember(id)
      toast.success('חבר המשפחה נמחק')
    } catch (error) {
      toast.error('שגיאה במחיקה: ' + error.message)
    }
  }

  const getMemberColor = (index) => {
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' },
      { bg: 'bg-pink-100', text: 'text-pink-600', border: 'border-pink-200', dot: 'bg-pink-500' },
      { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200', dot: 'bg-green-500' },
      { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200', dot: 'bg-purple-500' },
      { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200', dot: 'bg-orange-500' },
    ]
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-blue-500" />
          הוספת חבר משפחה חדש
        </h3>

        <div className="flex gap-3">
          <input
            type="text"
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            placeholder="שם חבר המשפחה"
            className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />

          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Users size={20} />
            חברי משפחה
            <span className="text-sm font-normal text-gray-500">({familyMembers.length})</span>
          </h3>
        </div>

        <div className="p-4">
          {familyMembers.length === 0 ? (
            <p className="text-center text-gray-400 py-8">אין חברי משפחה</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {familyMembers.map((member, index) => {
                const color = getMemberColor(index)

                return (
                  <div
                    key={member.id}
                    className={`p-4 rounded-xl border-2 ${color.border} ${color.bg} transition-all hover:shadow-md`}
                  >
                    {editingId === member.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                          autoFocus
                          onKeyPress={(e) => e.key === 'Enter' && saveEdit(member.id)}
                        />
                        <button
                          onClick={() => saveEdit(member.id)}
                          className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full ${color.text} ${color.bg} border-2 ${color.border} flex items-center justify-center`}>
                            <User size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-lg">{member.name}</h4>
                            <p className="text-sm text-gray-500">חבר משפחה</p>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(member)}
                            className="p-2 rounded-lg hover:bg-white/50 text-gray-600"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="p-2 rounded-lg hover:bg-white/50 text-red-500"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h4 className="font-bold text-blue-800 mb-2">💡 טיפ</h4>
        <p className="text-blue-700 text-sm">
          כל חבר משפחה יכול לנהל מקורות כספיים משלו (חשבונות בנק, כרטיסי אשראי, מזומן ועוד).
          לאחר הוספת חבר משפחה, עברו ללשונית "מקורות כספיים" כדי להוסיף לו מקורות.
        </p>
      </div>
    </div>
  )
}

export default FamilyMembers
