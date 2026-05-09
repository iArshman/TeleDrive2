/**
 * TeleDrive - Login Page
 * Simple Telegram User ID login (no webhook required)
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

const BOT_USERNAME = 'tdrivex2_bot'

function LoginPage() {
    const { isLoading, error, login, setError } = useAuth()
    const [userId, setUserId] = useState('')
    const [step, setStep] = useState('start') // 'start' | 'getId'

    const handleGetId = () => {
        // Open userinfobot to get user's Telegram ID
        window.open('https://t.me/userinfobot', '_blank')
        setStep('getId')
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!userId.trim()) return
        
        // Validate it looks like a Telegram user ID (numeric)
        const cleanId = userId.trim().replace(/\D/g, '')
        if (!cleanId || cleanId.length < 5) {
            setError('Please enter a valid Telegram User ID (numbers only)')
            return
        }
        
        const success = await login(cleanId)
        if (!success) {
            setUserId('')
        }
    }

    const handleBack = () => {
        setStep('start')
        setUserId('')
        setError(null)
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
                        <span className="error-icon">&#9888;</span>
                        <span>{error}</span>
                        <button className="error-close" onClick={() => setError(null)}>&#215;</button>
                    </div>
                )}

                {step === 'start' && (
                    <div className="login-section">
                        <p className="login-instruction">
                            Login with your Telegram account to access your cloud storage
                        </p>

                        <button 
                            className="btn-telegram"
                            onClick={handleGetId}
                        >
                            <svg className="telegram-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.429-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.144.121.101.154.237.169.332.016.095.035.312.02.481z"/>
                            </svg>
                            Continue with Telegram
                        </button>

                        <div className="login-divider">
                            <span>How it works</span>
                        </div>

                        <ol className="login-steps">
                            <li>Click to open @userinfobot in Telegram</li>
                            <li>Press START to get your User ID</li>
                            <li>Copy your numeric ID and paste it here</li>
                        </ol>

                        <div className="bot-info">
                            <p>Files will be stored via <strong>@{BOT_USERNAME}</strong></p>
                        </div>
                    </div>
                )}

                {step === 'getId' && (
                    <div className="login-section">
                        <button className="btn-back" onClick={handleBack}>
                            &#8592; Back
                        </button>

                        <p className="login-instruction">
                            Enter your Telegram User ID from @userinfobot
                        </p>

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="form-group">
                                <label htmlFor="userId">Telegram User ID</label>
                                <input
                                    id="userId"
                                    type="text"
                                    inputMode="numeric"
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    placeholder="e.g. 123456789"
                                    autoFocus
                                    disabled={isLoading}
                                    className="code-input"
                                    autoComplete="off"
                                />
                                <span className="form-hint">Your numeric Telegram ID (not username)</span>
                            </div>
                            <button 
                                type="submit" 
                                className="btn-primary login-btn" 
                                disabled={isLoading || !userId.trim()}
                            >
                                {isLoading ? <span className="spinner"></span> : 'Login'}
                            </button>
                        </form>

                        <p className="help-text">
                            {"Don't have your ID?"}{' '}
                            <button className="link-btn" onClick={handleGetId}>
                                Open @userinfobot
                            </button>
                        </p>
                    </div>
                )}

                <div className="login-footer">
                    <p>Your files are stored securely in Telegram</p>
                    <p className="security-note">End-to-end encrypted</p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
