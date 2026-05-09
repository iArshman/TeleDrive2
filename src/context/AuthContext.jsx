/**
 * TeleDrive - Authentication Context
 * Manages Telegram authentication state
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [authStep, setAuthStep] = useState('phone') // phone, code, 2fa
    const [phoneCodeHash, setPhoneCodeHash] = useState(null)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [error, setError] = useState(null)

    // Lazy-loaded telegram service reference
    const telegramServiceRef = useRef(null)

    // Get telegram service (lazy load)
    const getTelegramService = useCallback(async () => {
        if (!telegramServiceRef.current) {
            const module = await import('../lib/telegram')
            telegramServiceRef.current = module.default
        }
        return telegramServiceRef.current
    }, [])

    // Initialize on mount with a slight delay to allow UI to render first
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
            const service = await getTelegramService()
            const savedSession = await service.loadSession()
            await service.init(savedSession)

            if (savedSession) {
                const isAuth = await service.isAuthenticated()
                if (isAuth) {
                    const me = await service.getMe()
                    setUser(me)
                    setIsAuthenticated(true)

                    if (me) {
                        await service.addAccount({
                            id: me.id.toString(),
                            firstName: me.firstName,
                            lastName: me.lastName,
                            username: me.username,
                            phone: me.phone,
                            session: savedSession,
                        })
                    }
                }
            }
        } catch (err) {
            console.error('Auth initialization error:', err)
            // Don't show error to user for initial connection issues
            // setError('Failed to connect to Telegram')
        } finally {
            setIsLoading(false)
        }
    }

    const sendCode = useCallback(async (phone) => {
        setError(null)
        setIsLoading(true)

        try {
            const service = await getTelegramService()
            const result = await service.sendCode(phone)
            setPhoneNumber(phone)
            setPhoneCodeHash(result.phoneCodeHash)
            setAuthStep('code')
            return true
        } catch (err) {
            console.error('Send code error:', err)
            setError(err.message || 'Failed to send code')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [getTelegramService])

    const verifyCode = useCallback(async (code) => {
        setError(null)
        setIsLoading(true)

        try {
            const service = await getTelegramService()
            await service.signIn(phoneNumber, code, phoneCodeHash)

            const me = await service.getMe()
            setUser(me)
            setIsAuthenticated(true)
            setAuthStep('phone')

            if (me) {
                const session = service.session.save()
                await service.addAccount({
                    id: me.id.toString(),
                    firstName: me.firstName,
                    lastName: me.lastName,
                    username: me.username,
                    phone: me.phone,
                    session,
                })
            }

            return true
        } catch (err) {
            console.error('Verify code error:', err)
            if (err.type === '2FA_REQUIRED') {
                setAuthStep('2fa')
                return true
            }
            setError(err.message || 'Invalid code')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [phoneNumber, phoneCodeHash, getTelegramService])

    const verify2FA = useCallback(async (password) => {
        setError(null)
        setIsLoading(true)

        try {
            const service = await getTelegramService()
            await service.signInWith2FA(password)

            const me = await service.getMe()
            setUser(me)
            setIsAuthenticated(true)
            setAuthStep('phone')

            if (me) {
                const session = service.session.save()
                await service.addAccount({
                    id: me.id.toString(),
                    firstName: me.firstName,
                    lastName: me.lastName,
                    username: me.username,
                    phone: me.phone,
                    session,
                })
            }

            return true
        } catch (err) {
            console.error('2FA error:', err)
            setError(err.message || 'Invalid password')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [getTelegramService])

    const loginWithSession = useCallback(async (sessionString) => {
        setError(null)
        setIsLoading(true)

        try {
            const service = await getTelegramService()
            await service.init(sessionString)

            const isAuth = await service.isAuthenticated()
            if (!isAuth) {
                throw new Error('Session is invalid or expired. Please check the session string and try again.')
            }

            const me = await service.getMe()
            setUser(me)
            setIsAuthenticated(true)
            setAuthStep('phone')

            // Persist session so next load auto-logs in
            await service.saveSession(sessionString)

            if (me) {
                await service.addAccount({
                    id: me.id.toString(),
                    firstName: me.firstName,
                    lastName: me.lastName,
                    username: me.username,
                    phone: me.phone,
                    session: sessionString,
                })
            }

            return true
        } catch (err) {
            console.error('Session login error:', err)
            setError(err.message || 'Failed to login with session string')
            return false
        } finally {
            setIsLoading(false)
        }
    }, [getTelegramService])

    const logout = useCallback(async () => {
        setIsLoading(true)
        try {
            const service = await getTelegramService()
            await service.logout()
            setUser(null)
            setIsAuthenticated(false)
            setAuthStep('phone')
            setPhoneCodeHash(null)
            setPhoneNumber('')
        } catch (err) {
            console.error('Logout error:', err)
        } finally {
            setIsLoading(false)
        }
    }, [getTelegramService])

    const switchAccount = useCallback(async (account) => {
        setIsLoading(true)
        setError(null)

        try {
            const service = await getTelegramService()
            const success = await service.switchAccount(account.session)
            if (success) {
                const me = await service.getMe()
                setUser(me)
                setIsAuthenticated(true)
            } else {
                setError('Failed to switch account')
            }
        } catch (err) {
            console.error('Switch account error:', err)
            setError(err.message || 'Failed to switch account')
        } finally {
            setIsLoading(false)
        }
    }, [getTelegramService])

    const getAccounts = useCallback(async () => {
        try {
            const service = await getTelegramService()
            return await service.getAccounts()
        } catch {
            return []
        }
    }, [getTelegramService])

    const removeAccount = useCallback(async (accountId) => {
        try {
            const service = await getTelegramService()
            await service.removeAccount(accountId)
        } catch (e) {
            console.error('Remove account error:', e)
        }
    }, [getTelegramService])

    const value = {
        isAuthenticated,
        isLoading,
        user,
        authStep,
        error,
        sendCode,
        verifyCode,
        verify2FA,
        loginWithSession,
        logout,
        switchAccount,
        getAccounts,
        removeAccount,
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
