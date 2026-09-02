import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePreferencesStore } from './preferences'

const API_BASE = import.meta.env.VITE_API_BASE

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('authToken') || null)
  const loading = ref(false)
  const error = ref(null)

  // Check if user is logged in
  const isLoggedIn = () => !!user.value && !!token.value

  // Register new user
  const register = async (name, email, password) => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: name,
          email: email,
          senha: password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.erro || 'Erro ao registrar')
      }

      const data = await response.json()
      // After registration, automatically log in
      await login(email, password)
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Login user
  const login = async (email, password) => {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          senha: password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.erro || 'Erro ao fazer login')
      }

      const data = await response.json()
      user.value = data.user
      token.value = data.token
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      const preferencesStore = usePreferencesStore()
      preferencesStore.loadFromUser(data.user)
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // Logout user
  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    error.value = null
  }

  // Initialize user from localStorage
  const initializeUser = () => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('authToken')
    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser)
        user.value = parsed
        token.value = storedToken
        const preferencesStore = usePreferencesStore()
        preferencesStore.loadFromUser(parsed)
      } catch (err) {
        console.error('Failed to parse stored user', err)
        logout()
      }
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isLoggedIn,
    register,
    login,
    logout,
    initializeUser,
  }
})
