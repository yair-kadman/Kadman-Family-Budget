import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const DataContext = createContext({})

export const useData = () => useContext(DataContext)

export const DataProvider = ({ children }) => {
  const { user } = useAuth()
  const [familyMembers, setFamilyMembers] = useState([])
  const [categories, setCategories] = useState({ expense: [], income: [] })
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      fetchAllData()
      setupRealtimeSubscriptions()
    } else {
      setFamilyMembers([])
      setCategories({ expense: [], income: [] })
      setAccounts([])
      setTransactions([])
      setLoading(false)
    }
  }, [user])

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        fetchFamilyMembers(),
        fetchCategories(),
        fetchAccounts(),
        fetchTransactions()
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscriptions = () => {
    if (!user) return

    const familyMembersSubscription = supabase
      .channel('family_members_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'family_members', filter: `user_id=eq.${user.id}` },
        () => fetchFamilyMembers()
      )
      .subscribe()

    const categoriesSubscription = supabase
      .channel('categories_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` },
        () => fetchCategories()
      )
      .subscribe()

    const accountsSubscription = supabase
      .channel('accounts_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${user.id}` },
        () => fetchAccounts()
      )
      .subscribe()

    const transactionsSubscription = supabase
      .channel('transactions_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => fetchTransactions()
      )
      .subscribe()

    return () => {
      familyMembersSubscription.unsubscribe()
      categoriesSubscription.unsubscribe()
      accountsSubscription.unsubscribe()
      transactionsSubscription.unsubscribe()
    }
  }

  const fetchFamilyMembers = async () => {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    setFamilyMembers(data || [])
  }

  const addFamilyMember = async (name) => {
    const { data, error } = await supabase
      .from('family_members')
      .insert([{ user_id: user.id, name }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateFamilyMember = async (id, name) => {
    const { error } = await supabase
      .from('family_members')
      .update({ name })
      .eq('id', id)

    if (error) throw error
  }

  const deleteFamilyMember = async (id) => {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })

    if (error) throw error
    
    const grouped = {
      expense: (data || []).filter(c => c.type === 'expense'),
      income: (data || []).filter(c => c.type === 'income')
    }
    setCategories(grouped)
  }

  const addCategory = async (name, type) => {
    const maxOrder = Math.max(0, ...categories[type].map(c => c.sort_order || 0))
    const { data, error } = await supabase
      .from('categories')
      .insert([{ user_id: user.id, name, type, sort_order: maxOrder + 1 }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateCategory = async (id, updates) => {
    const { error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  }

  const deleteCategory = async (id) => {
    const { data: usedTransactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('category', categories.expense.find(c => c.id === id)?.name || categories.income.find(c => c.id === id)?.name)
      .limit(1)

    if (usedTransactions && usedTransactions.length > 0) {
      throw new Error('לא ניתן למחוק קטגוריה בשימוש')
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const reorderCategories = async (type, newOrder) => {
    const updates = newOrder.map((cat, index) => ({
      id: cat.id,
      sort_order: index
    }))

    for (const update of updates) {
      await supabase
        .from('categories')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }

    await fetchCategories()
  }

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*, family_members(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    
    const transformed = (data || []).map(acc => ({
      ...acc,
      familyMemberName: acc.family_members?.name || ''
    }))
    setAccounts(transformed)
  }

  const addAccount = async (name, familyMemberId, balance = 0) => {
    const { data, error } = await supabase
      .from('accounts')
      .insert([{ 
        user_id: user.id, 
        name, 
        family_member_id: familyMemberId,
        balance 
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  const updateAccount = async (id, updates) => {
    const { error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  }

  const deleteAccount = async (id) => {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, family_members(name), accounts(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (error) throw error
    
    const transformed = (data || []).map(t => ({
      ...t,
      familyMemberName: t.family_members?.name || '',
      accountName: t.accounts?.name || ''
    }))
    setTransactions(transformed)
  }

  const addTransaction = async (transaction) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        category: transaction.category,
        date: transaction.date,
        family_member_id: transaction.familyMemberId,
        account_id: transaction.accountId,
        note: transaction.note || '',
        is_recurring: transaction.isRecurring || false,
        frequency: transaction.frequency || null
      }])
      .select()
      .single()

    if (error) throw error

    const balanceChange = transaction.type === 'income' 
      ? parseFloat(transaction.amount) 
      : -parseFloat(transaction.amount)

    const account = accounts.find(a => a.id === parseInt(transaction.accountId))
    if (account) {
      await updateAccount(transaction.accountId, { 
        balance: (account.balance || 0) + balanceChange 
      })
    }

    return data
  }

  const updateTransaction = async (id, updates, oldTransaction) => {
    if (oldTransaction) {
      const oldAccount = accounts.find(a => a.id === oldTransaction.account_id)
      if (oldAccount) {
        const revertChange = oldTransaction.type === 'income' 
          ? -oldTransaction.amount 
          : oldTransaction.amount
        await updateAccount(oldTransaction.account_id, {
          balance: (oldAccount.balance || 0) + revertChange
        })
      }
    }

    const { error } = await supabase
      .from('transactions')
      .update({
        type: updates.type,
        amount: parseFloat(updates.amount),
        category: updates.category,
        date: updates.date,
        family_member_id: updates.familyMemberId,
        account_id: updates.accountId,
        note: updates.note || '',
        is_recurring: updates.isRecurring || false,
        frequency: updates.frequency || null
      })
      .eq('id', id)

    if (error) throw error

    const newAccount = accounts.find(a => a.id === parseInt(updates.accountId))
    if (newAccount) {
      const newChange = updates.type === 'income' 
        ? parseFloat(updates.amount) 
        : -parseFloat(updates.amount)
      await updateAccount(updates.accountId, {
        balance: (newAccount.balance || 0) + newChange
      })
    }
  }

  const deleteTransaction = async (id) => {
    const transaction = transactions.find(t => t.id === id)
    if (transaction) {
      const account = accounts.find(a => a.id === transaction.account_id)
      if (account) {
        const revertChange = transaction.type === 'income' 
          ? -transaction.amount 
          : transaction.amount
        await updateAccount(transaction.account_id, {
          balance: (account.balance || 0) + revertChange
        })
      }
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  const initializeDefaultData = async () => {
    const { data: existingMembers } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (existingMembers && existingMembers.length > 0) {
      return
    }

    const yair = await addFamilyMember('יאיר')
    const racheli = await addFamilyMember('רחלי')

    const defaultExpenseCategories = ['סופר', 'אוכל בחוץ והזמנות', 'לימודים', 'רכב', 'חיסכון', 'גולי']
    const defaultIncomeCategories = ['הכנסה קבועה', 'הכנסה משתנה']

    for (let i = 0; i < defaultExpenseCategories.length; i++) {
      await supabase.from('categories').insert([{
        user_id: user.id,
        name: defaultExpenseCategories[i],
        type: 'expense',
        sort_order: i
      }])
    }

    for (let i = 0; i < defaultIncomeCategories.length; i++) {
      await supabase.from('categories').insert([{
        user_id: user.id,
        name: defaultIncomeCategories[i],
        type: 'income',
        sort_order: i
      }])
    }

    const yairAccounts = ['חשבון בנק פרטי', 'חשבון בנק עסקי', 'כרטיס אשראי', 'מזומן', 'Bit', 'PayBox']
    for (const name of yairAccounts) {
      await supabase.from('accounts').insert([{
        user_id: user.id,
        name,
        family_member_id: yair.id,
        balance: 0
      }])
    }

    const racheliAccounts = ['חשבון בנק', 'מזומן', 'Bit', 'PayBox']
    for (const name of racheliAccounts) {
      await supabase.from('accounts').insert([{
        user_id: user.id,
        name,
        family_member_id: racheli.id,
        balance: 0
      }])
    }

    await fetchAllData()
  }

  const value = {
    familyMembers,
    categories,
    accounts,
    transactions,
    loading,
    error,
    fetchAllData,
    addFamilyMember,
    updateFamilyMember,
    deleteFamilyMember,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    initializeDefaultData
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}
