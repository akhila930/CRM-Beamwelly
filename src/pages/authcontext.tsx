import { createContext, useContext, useState, ReactNode } from 'react'
import axios from 'axios'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

// Base API URL - change this if your backend URL changes
const API_BASE_URL = 'http://localhost:8000'

interface AuthContextType {
  user: any
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, role: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/token`, {
        username: email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      
      const token = response.data.access_token
      localStorage.setItem('token', token)
      
      // Fetch user data
      const userResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      setUser(userResponse.data)
      
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      })

      // Redirect to dashboard after successful login
      navigate('/dashboard')
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: 'Login failed',
        description: error.response?.data?.detail || 'Invalid credentials',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string, role: string) => {
    setIsLoading(true)
    try {
      console.log('Signing up with:', { name, email, password, role })
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        name,
        email,
        password,
        role,
      })
      
      console.log('Signup response:', response.data)
      
      // In development mode, we'll auto-login the user
      await login(email, password)
      
      toast({
        title: 'Account created',
        description: 'Welcome to EquityWala!',
      })
    } catch (error) {
      console.error('Signup error:', error)
      toast({
        title: 'Signup failed',
        description: error.response?.data?.detail || 'An error occurred',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    navigate('/auth')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
