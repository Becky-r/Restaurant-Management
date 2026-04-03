"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

interface User {
  id: string
  name: string
  username: string
  role: "ADMIN" | "WAITER" | "CASHIER" | "CHEF"
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in from Cookies/localStorage on mount
    const storedToken = Cookies.get("token")
    const storedUser = localStorage.getItem("user")

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    
    // Set cookie for middleware (expires in 24h as per JWT)
    Cookies.set("token", newToken, { expires: 1 })
    Cookies.set("role", newUser.role, { expires: 1 })
    localStorage.setItem("user", JSON.stringify(newUser))
    
    // Redirect based on role
    if (newUser.role === "CHEF") {
      router.push("/kitchen")
    } else if (newUser.role === "ADMIN") {
      router.push("/")
    } else {
      router.push("/pos")
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    Cookies.remove("token")
    Cookies.remove("role")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
