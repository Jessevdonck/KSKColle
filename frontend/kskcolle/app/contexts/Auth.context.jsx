"use client"
import { createContext, useState, useCallback, useMemo, useEffect } from "react"
import useSWRMutation from "swr/mutation"
import * as api from "../api"
import useSWR from "swr"

export const JWT_TOKEN_KEY = "jwtToken"
export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(typeof window !== "undefined" ? localStorage.getItem(JWT_TOKEN_KEY) : null)

  const { data: user, error: userError, mutate: mutateUser } = useSWR(token ? "users/me" : null, api.getById)

  const { isMutating: loginLoading, error: loginError, trigger: doLogin } = useSWRMutation("sessions", api.post)

  const { isMutating: registerLoading, error: registerError, trigger: doRegister } = useSWRMutation("users", api.post)

  const setSession = useCallback((token) => {
    setToken(token)
    if (token) {
      localStorage.setItem(JWT_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(JWT_TOKEN_KEY)
    }
  }, [])

  const login = useCallback(
    async (email, password) => {
      try {
        const { token } = await doLogin({
          email,
          password,
        })

        setSession(token)
        return true
      } catch (error) {
        console.error(error)
        return false
      }
    },
    [doLogin, setSession],
  )

  const register = useCallback(
    async (data) => {
      try {
        const { token } = await doRegister(data)
        setSession(token)
        return true
      } catch (error) {
        console.error(error)
        return false
      }
    },
    [doRegister, setSession],
  )

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem(JWT_TOKEN_KEY)
    mutateUser(null, false)
  }, [mutateUser])

  // Check for token expiration
  const checkTokenExpiration = useCallback(async () => {
    if (token) {
      try {
        await api.getById("users/me")
      } catch (error) {
        if (error.status === 401) {
          logout()
        }
      }
    }
  }, [token, logout])

  useEffect(() => {
    // Initial check
    checkTokenExpiration()

    // Set up periodic check
    const intervalId = setInterval(checkTokenExpiration, 60000) // Check every minute

    return () => clearInterval(intervalId)
  }, [checkTokenExpiration])

  const value = useMemo(
    () => ({
      user,
      error: loginError || userError || registerError,
      loading: loginLoading || registerLoading,
      isAuthed: Boolean(token && user),
      ready: Boolean(user) || (!token && !userError),
      login,
      logout,
      register,
      mutateUser,
    }),
    [token, user, loginError, loginLoading, userError, registerError, registerLoading, login, logout, register, mutateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

