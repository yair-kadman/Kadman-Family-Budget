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

    if (error) throw e
