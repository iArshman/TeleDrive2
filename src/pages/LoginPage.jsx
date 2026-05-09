/**
 * TeleDrive - Login Page
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

function LoginPage() {
    const {
        authStep, isLoading, error,
        hasCredentials, saveCredentials, clearCredentials,
        sendCode, verifyCode, verify2FA, loginWithSession,
        setError,
    } = useAuth()

    const [phone, setPhone] = useState('')
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')
    const [sessionString, setSessionString] = useState('')
    const [loginMode, setLoginMode] = useState('phone') // 'phone' | 'session'

    // API credentials entry state
    const [apiId, setApiId] = useState('')
    const [apiHash, setApiHash] = useState('')
    const [editingCreds, setEditingCreds] = useState(false)

    // ---- Handlers ----

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault()
        if (!apiId.trim() || !apiHash.trim()) return
        const ok = await saveCredentials(apiId.trim(), apiHash.trim())
        if (ok) {
            setApiId('')
            setApiHash('')
            setEditingCreds(false)
        }
    }

    const handleClearCredentials = async () => {
        await clearCredentials()
        setEditingCreds(false)
        setError(null)
    }

    const handlePhoneSubmit = async (e) => {
        e.preventDefault()
        if (!phone.trim()) return
        await sendCode(phone.trim())
    }

    const handleCodeSubmit = async (e) => {
        e.preventDefault()
        if (!code.trim()) return
        await verifyCode(code.trim())
    }

    const handle2FASubmit = async (e) => {
        e.preventDefault()
        if (!password) return
        await verify2FA(password)
    }

    const handleSessionSubmit = async (e) => {
        e.preventDefault()
        if (!sessionString.trim()) return
        await loginWithSession(sessionString.trim())
    }

    const switchMode = (mode) => {
        setError(null)
        setLoginMode(mode)
    }

    // ---- Credentials form (shown when no creds saved OR user clicks edit) ----
    const showCredentialsForm = hasCredentials === false || editingCreds

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">
                        <svg viewBox="0 0 100 100" className="logo-icon">
                            <defs>
                                <linearGradient id="teleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#0088cc' }} />
                                    <stop offset="100%" style={{ stopColor: '#00a8e8' }} />
                                </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r="45" fill="url(#teleGrad)" />
                            <path d="M30 50 L45 50 L50 35 L55 60 L60 50 L70 50" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M25 65 L75 65" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
                            <path d="M30 72 L70 72" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
                        </svg>
                    </div>
                    <h1>TeleDrive</h1>
                    <p className="login-subtitle">Cloud storage powered by Telegram</p>
                </div>

                {error && (
                    <div className="login-error">
                        <span className="error-icon">&#9888;</span>
                        <span>{error}</span>
                        <button className="error-close" onClick={() => setError(null)}>&#215;</button>
                    </div>
                )}

                {/* ---- Step 1: API Credentials ---- */}
                {showCredentialsForm && (
                    <div className="creds-section">
                        <div className="creds-header">
                            <h2 className="creds-title">API Credentials</h2>
                            <p className="creds-desc">
                                Get your API ID and Hash from{' '}
                                <a href="https://my.telegram.org/apps" target="_blank" rel="noreferrer" className="creds-link">
                                    my.telegram.org/apps
                                </a>
                            </p>
                        </div>
                        <form onSubmit={handleCredentialsSubmit} className="login-form">
                            <div className="form-group">
                                <label htmlFor="apiId">API ID</label>
                                <input
                                    id="apiId"
                                    type="text"
                                    inputMode="numeric"
                                    value={apiId}
                                    onChange={(e) => setApiId(e.target.value)}
                                    placeholder="12345678"
                                    autoFocus
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="apiHash">API Hash</label>
                                <input
                                    id="apiHash"
                                    type="text"
                                    value={apiHash}
                                    onChange={(e) => setApiHash(e.target.value)}
                                    placeholder="0123456789abcdef0123456789abcdef"
                                    disabled={isLoading}
                                    className="mono-input"
                                />
                            </div>
                            <div className="creds-actions">
                                <button
                                    type="submit"
                                    className="btn-primary login-btn"
                                    disabled={isLoading || !apiId.trim() || !apiHash.trim()}
                                >
                                    {isLoading ? <span className="spinner"></span> : 'Save Credentials'}
                                </button>
                                {editingCreds && (
                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        onClick={() => { setEditingCreds(false); setError(null) }}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {/* ---- Step 2: Auth (phone or session) — only shown when creds are saved ---- */}
                {hasCredentials && !editingCreds && (
                    <>
                        {/* Tabs — only on initial phone step */}
                        {authStep === 'phone' && (
                            <div className="login-tabs">
                                <button
                                    type="button"
                                    className={`login-tab${loginMode === 'phone' ? ' active' : ''}`}
                                    onClick={() => switchMode('phone')}
                                >
                                    Phone Number
                                </button>
                                <button
                                    type="button"
                                    className={`login-tab${loginMode === 'session' ? ' active' : ''}`}
                                    onClick={() => switchMode('session')}
                                >
                                    Session String
                                </button>
                            </div>
                        )}

                        {authStep === 'phone' && loginMode === 'phone' && (
                            <form onSubmit={handlePhoneSubmit} className="login-form">
                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+1234567890"
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                    <span className="form-hint">Include country code</span>
                                </div>
                                <button type="submit" className="btn-primary login-btn" disabled={isLoading || !phone.trim()}>
                                    {isLoading ? <span className="spinner"></span> : 'Continue'}
                                </button>
                            </form>
                        )}

                        {authStep === 'phone' && loginMode === 'session' && (
                            <form onSubmit={handleSessionSubmit} className="login-form">
                                <div className="form-group">
                                    <label htmlFor="session">Session String</label>
                                    <textarea
                                        id="session"
                                        className="session-input"
                                        value={sessionString}
                                        onChange={(e) => setSessionString(e.target.value)}
                                        placeholder="Paste your GramJS StringSession here..."
                                        autoFocus
                                        disabled={isLoading}
                                        rows={4}
                                    />
                                    <span className="form-hint">Paste the session string exported from GramJS / TDLib</span>
                                </div>
                                <button type="submit" className="btn-primary login-btn" disabled={isLoading || !sessionString.trim()}>
                                    {isLoading ? <span className="spinner"></span> : 'Login with Session'}
                                </button>
                            </form>
                        )}

                        {authStep === 'code' && (
                            <form onSubmit={handleCodeSubmit} className="login-form">
                                <div className="form-group">
                                    <label htmlFor="code">Verification Code</label>
                                    <input
                                        id="code"
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="12345"
                                        autoFocus
                                        disabled={isLoading}
                                        maxLength={6}
                                    />
                                    <span className="form-hint">Enter the code sent to your Telegram</span>
                                </div>
                                <button type="submit" className="btn-primary login-btn" disabled={isLoading || !code.trim()}>
                                    {isLoading ? <span className="spinner"></span> : 'Verify'}
                                </button>
                            </form>
                        )}

                        {authStep === '2fa' && (
                            <form onSubmit={handle2FASubmit} className="login-form">
                                <div className="form-group">
                                    <label htmlFor="password">Two-Factor Password</label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your 2FA password"
                                        autoFocus
                                        disabled={isLoading}
                                    />
                                    <span className="form-hint">Your Telegram cloud password</span>
                                </div>
                                <button type="submit" className="btn-primary login-btn" disabled={isLoading || !password}>
                                    {isLoading ? <span className="spinner"></span> : 'Login'}
                                </button>
                            </form>
                        )}

                        {/* Edit / clear credentials link */}
                        {authStep === 'phone' && (
                            <div className="creds-edit-row">
                                <button
                                    type="button"
                                    className="creds-edit-btn"
                                    onClick={() => { setEditingCreds(true); setError(null) }}
                                >
                                    Edit API credentials
                                </button>
                                <span className="creds-divider">·</span>
                                <button
                                    type="button"
                                    className="creds-edit-btn creds-danger"
                                    onClick={handleClearCredentials}
                                >
                                    Clear &amp; reset
                                </button>
                            </div>
                        )}
                    </>
                )}

                <div className="login-footer">
                    <p>Your files are stored in your Telegram account</p>
                    <p className="security-note">End-to-end encrypted</p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
