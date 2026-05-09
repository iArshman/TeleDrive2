/**
 * TeleDrive - Authentication Context
 * No login required - uses bot token directly
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    // Always authenticated since we use bot token
    const [isAuthenticated, setIsAuthenticated] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [user, setUser] = useState({ id: 'owner', name: 'TeleDrive User' })
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

    /**
     * Logout - just clears local state
     */
    const logout = useCallback(async () => {
        setIsLoading(true)
        try {
            const service = await getBotService()
            await service.logout()
            // Still authenticated but clear files
            setUser({ id: 'owner', name: 'TeleDrive User' })
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
        logout,
        setError,
        getBotService,
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
