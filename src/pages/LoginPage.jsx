/**
 * TeleDrive - Login Page
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

function LoginPage() {
    const { authStep, isLoading, error, sendCode, verifyCode, verify2FA, setError } = useAuth()
    const [phone, setPhone] = useState('')
    const [code, setCode] = useState('')
    const [password, setPassword] = useState('')

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
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                        <button className="error-close" onClick={() => setError(null)}>×</button>
                    </div>
                )}

                {authStep === 'phone' && (
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

                <div className="login-footer">
                    <p>Your files are stored in your Telegram account</p>
                    <p className="security-note">🔒 End-to-end encrypted</p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
