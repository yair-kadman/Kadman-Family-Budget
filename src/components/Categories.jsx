import React, { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useToast } from './Toast'
import { 
  Plus, Edit2, Trash2, X, Check, 
  GripVertical, Tag
} from 'lucide-react'

const Categories = () => {
  const { categories, addCategory, updateCategory, deleteCategory, reorderCategories, loading } = useData()
  const toast = useToast()

  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryType, setNewCategoryType] = useState('expense')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [draggedItem, setDraggedItem] = useState(null)

  const handleAdd = async () => {
    if (!newCategoryName.trim()) {
      toast.error('נא להזין שם קטגוריה')
      return
    }

    setIsAdding(true)
    try {
      await addCategory(newCategoryName.trim(), newCategoryType)
      toast.success('הקטגוריה נוספה בהצלחה')
      setNewCategoryName('')
    } catch (error) {
      toast.error('שגיאה בהוספה: ' + error.message)
    } finally {
      setIsAdding(false)
    }
  }

  const startEdit = (category) => {
    setEditingId(category.id)
    setEditingName(category.name)
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
      await updateCategory(id, { name: editingName.trim() })
      toast.success('הקטגוריה עודכנה')
      cancelEdit()
    } catch (error) {
      toast.error('שגיאה בעדכון: ' + error.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('האם למחוק את הקטגוריה?')) return

    try {
      await deleteCategory(id)
      toast.success('הקטגוריה נמחקה')
    } catch (error) {
      toast.error('שגיאה במחיקה: ' + error.message)
    }
  }

  const handleDragStart = (e, category, type) => {
    setDraggedItem({ category, type })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetCategory, type) => {
    e.preventDefault()
    
    if (!draggedItem || draggedItem.type !== type) {
      setDraggedItem(null)
      return
    }

    const currentList = [...categories[type]]
    const draggedIndex = currentList.findIndex(c => c.id === draggedItem.category.id)
    const targetIndex = currentList.findIndex(c => c.id === targetCategory.id)

    if (draggedIndex === targetIndex) {
      setDraggedItem(null)
      return
    }

    const [removed] = currentList.splice(draggedIndex, 1)
    currentList.splice(targetIndex, 0, removed)

    try {
      await reorderCategories(type, currentList)
      toast.success('הסדר עודכן')
    } catch (error) {
      toast.error('שגיאה בעדכון סדר')
    }

    setDraggedItem(null)
  }

  const renderCategoryList = (type, title, bgColor, textColor) => {
    const items = categories[type] || []

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`px-5 py-4 border-b ${bgColor}`}>
          <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2`}>
            <Tag size={20} />
            {title}
            <span className="text-sm font-normal">({items.length})</span>
          </h3>
        </div>

        <div className="p-4">
          {items.length === 0 ? (
            <p className="text-center text-gray-400 py-8">אין קטגוריות</p>
          ) : (
            <div className="space-y-2">
              {items.map((category) => (
                <div
                  key={category.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, category, type)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, category, type)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    draggedItem?.category.id === category.id
                      ? 'opacity-50 border-dashed border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                  }`}
                >
                  <GripVertical size={18} className="text-gray-400 cursor-grab" />

                  {editingId === category.id ? (
                    <>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 border border-blue-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyPress={(e) => e.key === 'Enter' && saveEdit(category.id)}
                      />
                      <button
                        onClick={() => saveEdit(category.id)}
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
                      <span className="flex-1 font-medium text-gray-700">{category.name}</span>
                      <button
                        onClick={() => startEdit(category)}
                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
          הוספת קטגוריה חדשה
        </h3>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="שם הקטגוריה"
            className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          />

          <select
            value={newCategoryType}
            onChange={(e) => setNewCategoryType(e.target.value)}
            className="border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
          >
            <option value="expense">הוצאה</option>
            <option value="income">הכנסה</option>
          </select>

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

        <p className="text-sm text-gray-500 mt-3">
          💡 ניתן לגרור קטגוריות כדי לשנות את הסדר שלהן
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderCategoryList('expense', 'קטגוריות הוצאות', 'bg-red-50', 'text-red-700')}
        {renderCategoryList('income', 'קטגוריות הכנסות', 'bg-green-50', 'text-green-700')}
      </div>
    </div>
  )
}

export default Categories
