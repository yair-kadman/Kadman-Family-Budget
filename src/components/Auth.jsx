import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './Toast'
import { Mail, Lock, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react'

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('נא למלא את כל השדות')
      return
    }

    if (!isLogin && password !== confirmPassword) {
      toast.error('הסיסמאות אינן תואמות')
      return
    }

    if (password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים')
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
        toast.success('התחברת בהצלחה!')
      } else {
        await signUp(email, password)
        toast.success('נרשמת בהצלחה! בדוק את המייל לאימות.')
      }
    } catch (error) {
      console.error('Auth error:', error)
      if (error.message.includes('Invalid login')) {
        toast.error('אימייל או סיסמה שגויים')
      } else if (error.message.includes('already registered')) {
        toast.error('האימייל הזה כבר רשום במערכת')
      } else {
        toast.error(error.message || 'שגיאה בהתחברות')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 mb-4 shadow-lg">
            <span className="text-3xl">💰</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">ניהול תקציב משפחתי</h1>
          <p className="text-gray-500 mt-2">נהלו את הכספים שלכם בקלות</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                isLogin 
                  ? 'bg-white shadow text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LogIn className="inline ml-2" size={18} />
              התחברות
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                !isLogin 
                  ? 'bg-white shadow text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="inline ml-2" size={18} />
              הרשמה
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אימייל
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סיסמה
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="fade-in">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  אימות סיסמה
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="spinner ml-2"></span>
                  מעבד...
                </span>
              ) : (
                isLogin ? 'התחבר' : 'הירשם'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {isLogin ? (
              <>
                אין לך חשבון?{' '}
                <button 
                  onClick={() => setIsLogin(false)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  הירשם עכשיו
                </button>
              </>
            ) : (
              <>
                יש לך כבר חשבון?{' '}
                <button 
                  onClick={() => setIsLogin(true)}
                  className="text-blue-600 hover:underline font-medium"
                >
                  התחבר
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          אפליקציה מאובטחת לניהול תקציב משפחתי
        </p>
      </div>
    </div>
  )
}

export default Auth
