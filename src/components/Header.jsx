/**
 * TeleDrive - Header/Toolbar Component
 */

import { useState } from 'react'
import { useFileSystem } from '../context/FileSystemContext'
import { Icons } from './Sidebar'
import './Header.css'

// Additional icons
const MoreIcons = {
    Grid: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
        </svg>
    ),
    List: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 14h4v-4H4v4zm0 5h4v-4H4v4zM4 9h4V5H4v4zm5 5h12v-4H9v4zm0 5h12v-4H9v4zM9 5v4h12V5H9z" />
        </svg>
    ),
    Search: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
    ),
    Sort: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
        </svg>
    ),
    Upload: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
        </svg>
    ),
    Clear: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
    ),
    Back: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
    ),
    Forward: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
        </svg>
    ),
    Menu: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
    ),
}

function Breadcrumb() {
    const { getBreadcrumbs, navigateTo, currentPath } = useFileSystem()
    const breadcrumbs = getBreadcrumbs()

    // Show logo on home screen
    if (currentPath === '/') {
        return (
            <div className="header-logo">
                <img src="/logo.png" alt="TeleDrive" className="logo-icon" />
                <span className="logo-text">TeleDrive Cloud Storage</span>
            </div>
        )
    }

    return (
        <div className="breadcrumb">
            {breadcrumbs.map((crumb, index) => (
                <span key={crumb.path} className="breadcrumb-item">
                    {index > 0 && <span className="breadcrumb-separator">/</span>}
                    <button
                        className={`breadcrumb-link ${index === breadcrumbs.length - 1 ? 'active' : ''}`}
                        onClick={() => navigateTo(crumb.path)}
                    >
                        {crumb.name}
                    </button>
                </span>
            ))}
        </div>
    )
}

function Header({ onUpload, onNewFolder }) {
    const {
        viewMode, setViewMode,
        sortBy, setSortBy,
        sortOrder, setSortOrder,
        searchQuery, setSearchQuery,
        currentPath, navigateUp
    } = useFileSystem()

    const [showSortMenu, setShowSortMenu] = useState(false)

    const sortOptions = [
        { value: 'name', label: 'Name' },
        { value: 'date', label: 'Date Modified' },
        { value: 'size', label: 'Size' },
        { value: 'type', label: 'Type' },
    ]

    const handleSortChange = (value) => {
        if (sortBy === value) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(value)
            setSortOrder('asc')
        }
        setShowSortMenu(false)
    }

    return (
        <header className="main-header">
            <div className="header-left">
                {/* Navigation buttons - only show when not at root */}
                {currentPath !== '/' && (
                    <div className="nav-buttons">
                        <button
                            className="btn-icon"
                            onClick={navigateUp}
                            title="Go back"
                        >
                            <MoreIcons.Back />
                        </button>
                    </div>
                )}

                {/* Breadcrumb */}
                <Breadcrumb />
            </div>

            <div className="header-right">
                {/* New Folder button */}
                <button className="btn-primary upload-btn" onClick={onNewFolder}>
                    <span>📁</span>
                    <span>New Folder</span>
                </button>

                {/* Upload button */}
                <button className="btn-primary upload-btn" onClick={onUpload}>
                    <MoreIcons.Upload />
                    <span>Upload</span>
                </button>
            </div>
        </header>
    )
}

export default Header
export { MoreIcons }
