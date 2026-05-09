/**
 * TeleDrive - Login Page
 * Uses Telegram Bot deeplink for authentication (works on any domain)
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

// Bot username - set this in your environment
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || ''

function LoginPage() {
    const { isLoading, error, login, setError } = useAuth()
    const [authCode, setAuthCode] = useState('')
    const [step, setStep] = useState('start') // 'start' | 'verify'
    const [generatedCode, setGeneratedCode] = useState('')

    // Generate a random auth code for this session
    useEffect(() => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase()
        setGeneratedCode(code)
    }, [])

    const botDeeplink = BOT_USERNAME 
        ? `https://t.me/${BOT_USERNAME}?start=auth_${generatedCode}`
        : null

    const handleStartAuth = () => {
        if (!botDeeplink) {
            setError('Bot username not configured. Please set VITE_TELEGRAM_BOT_USERNAME.')
            return
        }
        window.open(botDeeplink, '_blank')
        setStep('verify')
    }

    const handleVerifyCode = async (e) => {
        e.preventDefault()
        if (!authCode.trim()) return
        
        const success = await login(authCode.trim())
        if (!success) {
            setAuthCode('')
        }
    }

    const handleBack = () => {
        setStep('start')
        setAuthCode('')
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
                            Click the button below to open our Telegram bot and get your login code
                        </p>

                        <button 
                            className="btn-telegram"
                            onClick={handleStartAuth}
                            disabled={!BOT_USERNAME}
                        >
                            <svg className="telegram-icon" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.429-.008-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.144.121.101.154.237.169.332.016.095.035.312.02.481z"/>
                            </svg>
                            Open Telegram Bot
                        </button>

                        {!BOT_USERNAME && (
                            <p className="config-warning">
                                Bot not configured. Set VITE_TELEGRAM_BOT_USERNAME in your environment.
                            </p>
                        )}

                        <div className="login-divider">
                            <span>How it works</span>
                        </div>

                        <ol className="login-steps">
                            <li>Click the button to open our bot</li>
                            <li>Press START in Telegram</li>
                            <li>Copy the code the bot sends you</li>
                            <li>Paste it here to login</li>
                        </ol>
                    </div>
                )}

                {step === 'verify' && (
                    <div className="login-section">
                        <button className="btn-back" onClick={handleBack}>
                            &#8592; Back
                        </button>

                        <p className="login-instruction">
                            Enter the code you received from the Telegram bot
                        </p>

                        <form onSubmit={handleVerifyCode} className="login-form">
                            <div className="form-group">
                                <label htmlFor="authCode">Authentication Code</label>
                                <input
                                    id="authCode"
                                    type="text"
                                    value={authCode}
                                    onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
                                    placeholder="Enter code from bot"
                                    autoFocus
                                    disabled={isLoading}
                                    className="code-input"
                                    autoComplete="off"
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="btn-primary login-btn" 
                                disabled={isLoading || !authCode.trim()}
                            >
                                {isLoading ? <span className="spinner"></span> : 'Login'}
                            </button>
                        </form>

                        <p className="help-text">
                            {"Didn't receive a code?"}{' '}
                            <button className="link-btn" onClick={handleStartAuth}>
                                Open bot again
                            </button>
                        </p>
                    </div>
                )}

                <div className="login-footer">
                    <p>Your files are stored securely via Telegram</p>
                    <p className="security-note">Powered by Telegram Bot API</p>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
