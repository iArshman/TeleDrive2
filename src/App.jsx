import { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import './styles/App.css'

// Lazy load DrivePage as it depends on FileSystemContext
const DrivePage = lazy(() => import('./pages/DrivePage'))
const FileSystemProvider = lazy(() =>
    import('./context/FileSystemContext').then(module => ({ default: module.FileSystemProvider }))
)

function LoadingFallback() {
    return (
        <div className="app-loading">
            <div className="spinner"></div>
            <p>Loading...</p>
        </div>
    )
}

function AppRoutes() {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return <LoadingFallback />
    }

    return (
        <Routes>
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
            />
            <Route
                path="/*"
                element={isAuthenticated ? (
                    <Suspense fallback={<LoadingFallback />}>
                        <FileSystemProviderWrapper>
                            <DrivePage />
                        </FileSystemProviderWrapper>
                    </Suspense>
                ) : (
                    <Navigate to="/login" replace />
                )}
            />
        </Routes>
    )
}

// Wrapper component for FileSystemProvider
function FileSystemProviderWrapper({ children }) {
    const [Provider, setProvider] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        import('./context/FileSystemContext')
            .then(module => {
                setProvider(() => module.FileSystemProvider)
            })
            .catch(err => {
                console.error('Failed to load FileSystemContext:', err)
                setError(err)
            })
    }, [])

    if (error) {
        return (
            <div className="error-container">
                <p>Failed to load file system</p>
            </div>
        )
    }

    if (!Provider) {
        return <LoadingFallback />
    }

    return <Provider>{children}</Provider>
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    )
}

export default App
