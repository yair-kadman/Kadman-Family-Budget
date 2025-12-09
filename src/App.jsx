import React, { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useData } from './contexts/DataContext'
import { useToast } from './components/Toast'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Categories from './components/Categories'
import Accounts from './components/Accounts'
import FamilyMembers from './components/FamilyMembers'
import { 
  TrendingUp, List, Tag, Wallet, Users, 
  LogOut, Menu, X, RefreshCw, Settings
} from 'lucide-react'

const App = () => {
  const { user, loading: authLoading, signOut } = useAuth()
  const { familyMembers, initializeDefaultData, fetchAllData, loading: dataLoading } = useData()
  const toast = useToast()
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (user && familyMembers.length === 0 && !dataLoading && !initialized) {
      setInitialized(true)
      initializeDefaultData().then(() => {
        toast.success('ברוכים הבאים! הנתונים הראשוניים נוצרו')
      }).catch(err => {
        console.error('Error initializing:', err)
      })
    }
  }, [user, familyMembers, dataLoading, initialized])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('להתראות!')
    } catch (error) {
      toast.error('שגיאה ביציאה')
    }
  }

  const handleRefresh = async () => {
    try {
      await fetchAllData()
      toast.success('הנתונים רועננו')
    } catch (error) {
      toast.error('שגיאה ברענון')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-500">טוען...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  const tabs = [
    { id: 'dashboard', label: 'דשבורד', icon: TrendingUp },
    { id: 'transactions', label: 'הוצאות והכנסות', icon: List },
    { id: 'categories', label: 'קטגוריות', icon: Tag },
    { id: 'accounts', label: 'מקורות כספיים', icon: Wallet },
    { id: 'family', label: 'חברי משפחה', icon: Users }
  ]

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">ניהול תקציב משפחתי</h1>
                <p className="text-sm text-purple-200 hidden md:block">{user.email}</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="רענן נתונים"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <LogOut size={18} />
                יציאה
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-white/10"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute top-16 right-0 left-0 bg-white shadow-lg p-4 fade-in" onClick={e => e.stopPropagation()}>
            <div className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={20} />
                  {tab.label}
                </button>
              ))}
              <hr className="my-2" />
              <button
                onClick={handleRefresh}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <RefreshCw size={20} />
                רענן נתונים
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
              >
                <LogOut size={20} />
                יציאה
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="hidden md:block bg-white shadow-sm sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {dataLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-gray-500">טוען נתונים...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'transactions' && <Transactions />}
            {activeTab === 'categories' && <Categories />}
            {activeTab === 'accounts' && <Accounts />}
            {activeTab === 'family' && <FamilyMembers />}
          </>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
        <div className="flex justify-around py-2">
          {tabs.slice(0, 4).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              <tab.icon size={20} />
              <span className="text-xs">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-500"
          >
            <Settings size={20} />
            <span className="text-xs">עוד</span>
          </button>
        </div>
      </nav>

      <div className="md:hidden h-20"></div>
    </div>
  )
}

export default App
