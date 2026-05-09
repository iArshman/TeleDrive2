/**
 * TeleDrive - Authentication Context
 * Uses Telegram Login Widget + Bot API (no GramJS)
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [error, setError] = useState(null)

    // Lazy-loaded bot service reference
    const botServiceRef = useRef(null)

    // Get bot service (lazy load)
    const getBotService = useCallback(async () => {
        if (!botServiceRef.current) {
            const module = await import('../lib/telegramBot')
            botServiceRef.current = module.default
        }
        return botServiceRef.current
    }, [])

    // Initialize on mount - check for saved session
    useEffect(() => {
        const timer = setTimeout(() => {
            initializeAuth()
        }, 100)
        return () => clearTimeout(timer)
    }, [])

    const initializeAuth = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const service = await getBotService()
            const savedUser = await service.loadSession()

            if (savedUser) {
                setUser(savedUser)
                setIsAuthenticated(true)
            }
        } catch (err) {
            console.error('Auth initialization error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    /**
     * Login with code from Telegram bot
     */
    const login = useCallback(async (authCode) => {
        setError(null)
        setIsLoading(true)

        try {
            const service = await getBotService()
            const userData = await service.verifyAuthCode(authCode)

            setUser(userData)
            setIsAuthenticated(true)

            return true
        } catch (err) {
            console.error('Login error:', err)
            setError(err.message || 'Invalid code. Please try again.')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [getBotService])

    /**
     * Logout
     */
    const logout = useCallback(async () => {
        setIsLoading(true)
        try {
            const service = await getBotService()
            await service.logout()
            setUser(null)
            setIsAuthenticated(false)
        } catch (err) {
            console.error('Logout error:', err)
        } finally {
            setIsLoading(false)
        }
    }, [getBotService])

    const value = {
        isAuthenticated,
        isLoading,
        user,
        error,
        login,
        logout,
        setError,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
