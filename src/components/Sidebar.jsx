/**
 * TeleDrive - Sidebar Component
 * Ubuntu Nautilus-inspired sidebar navigation
 */

import { useState, useMemo } from 'react'
import { useFileSystem } from '../context/FileSystemContext'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

// Icons as SVG components
const Icons = {
    Home: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
    ),
    Folder: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>
    ),
    FolderOpen: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10z" />
        </svg>
    ),
    Star: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
    ),
    Tag: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z" />
        </svg>
    ),
    Image: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
    ),
    Video: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
    ),
    Audio: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
    ),
    Document: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
        </svg>
    ),
    ChevronDown: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
    ),
    ChevronRight: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
    ),
    Settings: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
    ),
    User: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
    ),
    Logout: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
        </svg>
    ),
    Add: () => (
        <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
    ),
}

function FolderTreeItem({ folder, level = 0 }) {
    const { currentPath, navigateTo } = useFileSystem()
    const [isExpanded, setIsExpanded] = useState(currentPath.startsWith(folder.path + folder.name + '/'))

    const hasChildren = folder.children && folder.children.length > 0
    const folderPath = folder.path + folder.name + '/'
    const isActive = currentPath === folderPath

    const handleClick = () => {
        navigateTo(folderPath)
        if (hasChildren) {
            setIsExpanded(!isExpanded)
        }
    }

    return (
        <div className="folder-tree-item">
            <div
                className={`folder-item ${isActive ? 'active' : ''}`}
                style={{ paddingLeft: `${12 + level * 16}px` }}
                onClick={handleClick}
            >
                <span className={`folder-expand ${hasChildren ? 'has-children' : ''} ${isExpanded ? 'expanded' : ''}`}>
                    {hasChildren && <Icons.ChevronRight />}
                </span>
                <span className="folder-icon">
                    {isExpanded && hasChildren ? <Icons.FolderOpen /> : <Icons.Folder />}
                </span>
                <span className="folder-name">{folder.name}</span>
            </div>

            {isExpanded && hasChildren && (
                <div className="folder-children">
                    {folder.children.map((child, index) => (
                        <FolderTreeItem key={child.path + child.name + index} folder={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}

function Sidebar({ onNewFolder }) {
    const { currentPath, navigateTo, folderTree, getAllTags, filterTags, setFilterTags, files } = useFileSystem()
    const { user, logout, getAccounts, switchAccount } = useAuth()
    const [showAccountMenu, setShowAccountMenu] = useState(false)
    const [expandedSections, setExpandedSections] = useState({
        folders: true,
        tags: false,
        categories: true,
    })

    const tree = folderTree()
    const tags = getAllTags()
    const accounts = getAccounts()

    // Calculate category counts
    const categoryCounts = useMemo(() => {
        return {
            images: files.filter(f => f.fileType === 'image').length,
            videos: files.filter(f => f.fileType === 'video').length,
            audio: files.filter(f => f.fileType === 'audio').length,
            documents: files.filter(f => ['pdf', 'document', 'spreadsheet'].includes(f.fileType)).length,
        }
    }, [files])

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    const handleTagClick = (tag) => {
        if (filterTags.includes(tag)) {
            setFilterTags(filterTags.filter(t => t !== tag))
        } else {
            setFilterTags([...filterTags, tag])
        }
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-content">
                {/* Logo */}
                <div className="sidebar-logo">
                    <svg viewBox="0 0 100 100" className="logo-icon">
                        <defs>
                            <linearGradient id="sidebarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#0088cc' }} />
                                <stop offset="100%" style={{ stopColor: '#00a8e8' }} />
                            </linearGradient>
                        </defs>
                        <circle cx="50" cy="50" r="45" fill="url(#sidebarGrad)" />
                        <path d="M30 50 L45 50 L50 35 L55 60 L60 50 L70 50" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="logo-text">TeleDrive</span>
                </div>

                {/* Quick Navigation */}
                <nav className="sidebar-nav">
                    <div
                        className={`nav-item ${currentPath === '/' ? 'active' : ''}`}
                        onClick={() => navigateTo('/')}
                    >
                        <Icons.Home />
                        <span>Home</span>
                    </div>

                    <div className="nav-item" onClick={onNewFolder}>
                        <Icons.Add />
                        <span>New Folder</span>
                    </div>
                </nav>

                {/* Categories */}
                <div className="sidebar-section">
                    <div className="section-header" onClick={() => toggleSection('categories')}>
                        <span className={`section-expand ${expandedSections.categories ? 'expanded' : ''}`}>
                            <Icons.ChevronRight />
                        </span>
                        <span className="section-title">Categories</span>
                    </div>

                    {expandedSections.categories && (
                        <div className="section-content">
                            <div className="nav-item">
                                <Icons.Image />
                                <span>Images</span>
                                <span className="nav-badge">{categoryCounts.images}</span>
                            </div>
                            <div className="nav-item">
                                <Icons.Video />
                                <span>Videos</span>
                                <span className="nav-badge">{categoryCounts.videos}</span>
                            </div>
                            <div className="nav-item">
                                <Icons.Audio />
                                <span>Audio</span>
                                <span className="nav-badge">{categoryCounts.audio}</span>
                            </div>
                            <div className="nav-item">
                                <Icons.Document />
                                <span>Documents</span>
                                <span className="nav-badge">{categoryCounts.documents}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Folders */}
                <div className="sidebar-section">
                    <div className="section-header" onClick={() => toggleSection('folders')}>
                        <span className={`section-expand ${expandedSections.folders ? 'expanded' : ''}`}>
                            <Icons.ChevronRight />
                        </span>
                        <span className="section-title">Folders</span>
                    </div>

                    {expandedSections.folders && tree['/'] && (
                        <div className="section-content folder-tree">
                            {tree['/'].children.map((folder, index) => (
                                <FolderTreeItem key={folder.path + folder.name + index} folder={folder} />
                            ))}
                            {tree['/'].children.length === 0 && (
                                <div className="empty-folders">No folders yet</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Account Section */}
            <div className="sidebar-footer">
                <div
                    className="account-section"
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                >
                    <div className="account-avatar">
                        {user?.firstName?.[0] || user?.username?.[0] || '?'}
                    </div>
                    <div className="account-info">
                        <span className="account-name">{user?.firstName || user?.username || 'User'}</span>
                        <span className="account-phone">@{user?.username || 'telegram'}</span>
                    </div>
                    <Icons.ChevronDown />
                </div>

                {showAccountMenu && (
                    <div className="account-menu">
                        <div className="menu-section">
                            <div className="menu-label">Accounts</div>
                            {accounts.map(account => (
                                <div
                                    key={account.id}
                                    className={`menu-item ${account.id === user?.id?.toString() ? 'active' : ''}`}
                                    onClick={() => {
                                        if (account.id !== user?.id?.toString()) {
                                            switchAccount(account)
                                        }
                                        setShowAccountMenu(false)
                                    }}
                                >
                                    <div className="account-avatar small">
                                        {account.firstName?.[0] || account.username?.[0] || '?'}
                                    </div>
                                    <span>{account.firstName || account.username}</span>
                                </div>
                            ))}
                        </div>
                        <div className="menu-divider"></div>
                        <div className="menu-item" onClick={() => setShowAccountMenu(false)}>
                            <Icons.Settings />
                            <span>Settings</span>
                        </div>
                        <div className="menu-item danger" onClick={logout}>
                            <Icons.Logout />
                            <span>Logout</span>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    )
}

export default Sidebar
export { Icons }
