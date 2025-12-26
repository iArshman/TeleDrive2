/**
 * TeleDrive - File Grid Component
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { useFileSystem } from '../context/FileSystemContext'
import { formatSize, formatDate, getFileIcon } from '../lib/virtualFS'
import { Icons } from './Sidebar'
import localforage from 'localforage'
import './FileGrid.css'

// File type icons as SVG
// Thumbnail cache to avoid reloading
const thumbnailCache = new Map()

// Create localforage instance for thumbnail cache
const thumbnailStorage = localforage.createInstance({
    name: 'TeleDrive',
    storeName: 'grid_thumbnails'
})

// Get cached thumbnail from IndexedDB on load
const loadCachedThumbnails = async () => {
    try {
        // Migrate from localStorage if exists
        const oldCached = localStorage.getItem('teledrive_thumbnails')
        if (oldCached) {
            const parsed = JSON.parse(oldCached)
            for (const [key, value] of Object.entries(parsed)) {
                thumbnailCache.set(key, value)
            }
            // Save to IndexedDB and remove from localStorage
            await thumbnailStorage.setItem('cache', parsed)
            localStorage.removeItem('teledrive_thumbnails')
            console.log('TeleDrive: Thumbnail cache migrated to IndexedDB')
        } else {
            // Load from IndexedDB
            const cached = await thumbnailStorage.getItem('cache')
            if (cached) {
                Object.entries(cached).forEach(([key, value]) => {
                    thumbnailCache.set(key, value)
                })
            }
        }
    } catch (e) {
        console.warn('Failed to load thumbnail cache:', e)
    }
}
loadCachedThumbnails()

// Save thumbnail to cache
const saveThumbnailToCache = async (fileId, dataUrl) => {
    thumbnailCache.set(fileId, dataUrl)
    // Limit cache size
    if (thumbnailCache.size > 100) {
        const firstKey = thumbnailCache.keys().next().value
        thumbnailCache.delete(firstKey)
    }
    // Save to IndexedDB (limited to 50 entries for storage limits)
    try {
        const entries = Array.from(thumbnailCache.entries()).slice(-50)
        await thumbnailStorage.setItem('cache', Object.fromEntries(entries))
    } catch (e) {
        console.warn('Failed to save thumbnail cache:', e)
    }
}

// FileThumbnail component for images and videos
function FileThumbnail({ file, downloadFile }) {
    const [thumbnailUrl, setThumbnailUrl] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    useEffect(() => {
        let cancelled = false

        const loadThumbnail = async () => {
            // Check cache first
            const cached = thumbnailCache.get(file.id)
            if (cached) {
                setThumbnailUrl(cached)
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            setHasError(false)

            try {
                const buffer = await downloadFile(file.id)
                if (cancelled) return

                if (buffer) {
                    const blob = new Blob([buffer], { type: file.mimeType || 'application/octet-stream' })
                    const url = URL.createObjectURL(blob)

                    // For images, create a smaller cached version
                    if (file.fileType === 'image') {
                        const img = new Image()
                        img.onload = () => {
                            const canvas = document.createElement('canvas')
                            const maxSize = 150
                            let width = img.width
                            let height = img.height

                            if (width > height) {
                                if (width > maxSize) {
                                    height = (height * maxSize) / width
                                    width = maxSize
                                }
                            } else {
                                if (height > maxSize) {
                                    width = (width * maxSize) / height
                                    height = maxSize
                                }
                            }

                            canvas.width = width
                            canvas.height = height
                            const ctx = canvas.getContext('2d')
                            ctx.drawImage(img, 0, 0, width, height)

                            const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
                            saveThumbnailToCache(file.id, dataUrl)
                            setThumbnailUrl(dataUrl)
                            URL.revokeObjectURL(url)
                        }
                        img.onerror = () => {
                            setHasError(true)
                            URL.revokeObjectURL(url)
                        }
                        img.src = url
                    } else {
                        // For videos, use the blob URL directly
                        setThumbnailUrl(url)
                    }

                    setIsLoading(false)
                } else {
                    setHasError(true)
                    setIsLoading(false)
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Thumbnail load error:', err)
                    setHasError(true)
                    setIsLoading(false)
                }
            }
        }

        loadThumbnail()

        return () => {
            cancelled = true
        }
    }, [file.id, downloadFile])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (thumbnailUrl && !thumbnailUrl.startsWith('data:')) {
                URL.revokeObjectURL(thumbnailUrl)
            }
        }
    }, [thumbnailUrl])

    const isVideo = file.fileType === 'video'

    if (isLoading) {
        return (
            <div className="file-thumbnail loading">
                <div className="thumbnail-skeleton"></div>
            </div>
        )
    }

    if (hasError || !thumbnailUrl) {
        // Fallback to default icon
        const IconComponent = FileIcons[file.fileType] || FileIcons.file
        return <IconComponent />
    }

    return (
        <div className="file-thumbnail">
            {isVideo ? (
                <video
                    src={thumbnailUrl}
                    className="thumbnail-media"
                    muted
                    preload="metadata"
                />
            ) : (
                <img
                    src={thumbnailUrl}
                    alt={file.name}
                    className="thumbnail-media"
                />
            )}
            {isVideo && (
                <div className="video-play-overlay">
                    <svg viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            )}
        </div>
    )
}

const FileIcons = {
    folder: () => (
        <svg viewBox="0 0 48 48" fill="none">
            <path d="M40 12H22l-4-4H8c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V16c0-2.2-1.8-4-4-4z" fill="#FFC107" />
            <path d="M40 12H22l-4-4H8c-2.2 0-4 1.8-4 4v24c0 2.2 1.8 4 4 4h32c2.2 0 4-1.8 4-4V16c0-2.2-1.8-4-4-4z" fill="url(#folderGrad)" />
            <defs>
                <linearGradient id="folderGrad" x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FFD54F" />
                    <stop offset="1" stopColor="#FFC107" />
                </linearGradient>
            </defs>
        </svg>
    ),
    image: () => (
        <svg viewBox="0 0 48 48" fill="none">
            <rect x="6" y="8" width="36" height="32" rx="4" fill="#4CAF50" />
            <circle cx="16" cy="18" r="4" fill="#E8F5E9" />
            <path d="M6 32l8-8 6 6 10-10 12 12v4a4 4 0 01-4 4H10a4 4 0 01-4-4v-4z" fill="#81C784" />
        </svg>
    ),
    video: () => (
        <svg viewBox="0 0 48 48" fill="none">
            <rect x="6" y="10" width="36" height="28" rx="4" fill="#E91E63" />
            <path d="M20 17v14l11-7-11-7z" fill="white" />
        </svg>
    ),
    audio: () => (
        <svg viewBox="0 0 48 48" fill="none">
            <rect x="8" y="6" width="32" height="36" rx="4" fill="#9C27B0" />
            <circle cx="24" cy="28" r="8" fill="#E1BEE7" />
            <rect x="22" y="12" width="4" height="12" rx="2" fill="#E1BEE7" />
        </svg>
    ),
    pdf: () => (
        <svg viewBox="0 0 48 48" fill="none">
            <path d="M12 4h16l12 12v28a4 4 0 01-4 4H12a4 4 0 01-4-4V8a4 4 0 014-4z" fill="#F44336" />
            <path d="M28 4v8a4 4 0 004 4h8L28 4z" fill="#FFCDD2" />
            <text x="12" y="34" fill="white" fontSize="8" fontWeight="bold">PDF</text>
        </svg>
    ),
    document: () => (
        <svg viewBox="0 0 48 48" fill="none">
            <path d="M12 4h16l12 12v28a4 4 0 01-4 4H12a4 4 0 01-4-4V8a4 4 0 014-4z" fill="#2196F3" />
            <path d="M28 4v8a4 4 0 004 4h8L28 4z" fill="#BBDEFB" />
            <rect x="14" y="22" width="20" height="2" rx="1" fill="#BBDEFB" />
            <rect x="14" y="28" width="16" height="2" rx="1" fill="#BBDEFB" />
            <rect x="14" y="34" width="12" height="2" rx="1" fill="#BBDEFB" />
        </svg>
    ),
    spreadsheet: () => (
        <svg viewBox="0 0 48 48" fill="none">
            <path d="M12 4h16l12 12v28a4 4 0 01-4 4H12a4 4 0 01-4-4V8a4 4 0 014-4z" fill="#4CAF50" />
            <path d="M28 4v8a4 4 0 004 4h8L28 4z" fill="#C8E6C9" />
            <rect x="12" y="22" width="24" height="18" fill="#E8F5E9" />
            <line x1="20" y1="22" x2="20" y2="40" stroke="#4CAF50" strokeWidth="1" />
            <line x1="28" y1="22" x2="28" y2="40" stroke="#4CAF50" strokeWidth="1" />
            <line x1="12" y1="28" x2="36" y2="28" stroke="#4CAF50" strokeWidth="1" />
            <line x1="12" y1="34" x2="36" y2="34" stroke="#4CAF50" strokeWidth="1" />
        </svg>
    ),
    archive: () => (
        <svg viewBox="0 0 48 48" fill="none">
            <path d="M12 4h16l12 12v28a4 4 0 01-4 4H12a4 4 0 01-4-4V8a4 4 0 014-4z" fill="#795548" />
            <path d="M28 4v8a4 4 0 004 4h8L28 4z" fill="#D7CCC8" />
            <rect x="21" y="6" width="6" height="4" fill="#5D4037" />
            <rect x="21" y="12" width="6" height="4" fill="#5D4037" />
            <rect x="21" y="18" width="6" height="4" fill="#5D4037" />
            <rect x="18" y="26" width="12" height="10" rx="2" fill="#5D4037" />
        </svg>
    ),
    file: () => (
        <svg viewBox="0 0 48 48" fill="none">
            <path d="M12 4h16l12 12v28a4 4 0 01-4 4H12a4 4 0 01-4-4V8a4 4 0 014-4z" fill="#607D8B" />
            <path d="M28 4v8a4 4 0 004 4h8L28 4z" fill="#CFD8DC" />
        </svg>
    ),
    text: () => (
        <svg viewBox="0 0 48 48" fill="none">
            <path d="M12 4h16l12 12v28a4 4 0 01-4 4H12a4 4 0 01-4-4V8a4 4 0 014-4z" fill="#9E9E9E" />
            <path d="M28 4v8a4 4 0 004 4h8L28 4z" fill="#E0E0E0" />
            <rect x="14" y="22" width="20" height="2" rx="1" fill="#E0E0E0" />
            <rect x="14" y="28" width="16" height="2" rx="1" fill="#E0E0E0" />
            <rect x="14" y="34" width="12" height="2" rx="1" fill="#E0E0E0" />
        </svg>
    ),
}

function FileItem({ file, isSelected, onSelect, onOpen, onContextMenu, onDrop, isEditing: externalIsEditing, onEditComplete }) {
    const [isEditingInternal, setIsEditingInternal] = useState(false)
    const [editName, setEditName] = useState(file.name)
    const [isDragOver, setIsDragOver] = useState(false)
    const inputRef = useRef(null)
    const { renameItem, downloadFile } = useFileSystem()

    // Combine internal and external editing state
    const isEditing = isEditingInternal || externalIsEditing

    // Sync external editing state
    useEffect(() => {
        if (externalIsEditing) {
            setEditName(file.name)
        }
    }, [externalIsEditing, file.name])

    // Check if file should show thumbnail
    const shouldShowThumbnail = file.fileType === 'image' || file.fileType === 'video'

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleRename = async () => {
        if (editName.trim() && editName !== file.name) {
            await renameItem(file.id, editName.trim())
        }
        setIsEditingInternal(false)
        onEditComplete?.()
        setEditName(file.name)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleRename()
        } else if (e.key === 'Escape') {
            setIsEditingInternal(false)
            onEditComplete?.()
            setEditName(file.name)
        }
    }

    // Long press detection for mobile
    const longPressTimer = useRef(null)
    const touchStartPos = useRef({ x: 0, y: 0 })
    const [isLongPress, setIsLongPress] = useState(false)

    const handleTouchStart = (e) => {
        if (isEditing) return
        touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        setIsLongPress(false)

        longPressTimer.current = setTimeout(() => {
            setIsLongPress(true)
            // Trigger context menu on long press
            const touch = e.touches[0]
            onContextMenu({
                preventDefault: () => { },
                clientX: touch.clientX,
                clientY: touch.clientY
            }, file)
        }, 500) // 500ms for long press
    }

    const handleTouchMove = (e) => {
        // Cancel long press if finger moves too much
        const touch = e.touches[0]
        const dx = Math.abs(touch.clientX - touchStartPos.current.x)
        const dy = Math.abs(touch.clientY - touchStartPos.current.y)
        if (dx > 10 || dy > 10) {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current)
                longPressTimer.current = null
            }
        }
    }

    const handleTouchEnd = (e) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current)
            longPressTimer.current = null
        }

        // If it was a long press, don't trigger click
        if (isLongPress) {
            setIsLongPress(false)
            return
        }

        // Single tap opens file/folder on touch devices
        if (!isEditing) {
            onOpen(file)
        }
    }

    const handleClick = (e) => {
        if (isEditing) return

        // On touch devices, use touch handlers instead
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        if (isTouchDevice) {
            // Touch events handle this
            return
        }

        onSelect(file.id, e.ctrlKey || e.metaKey)
    }

    const handleDoubleClick = () => {
        if (isEditing) return
        onOpen(file)
    }

    // Drag handlers for moving files
    const handleDragStart = (e) => {
        if (file.type === 'folder') {
            e.preventDefault()
            return
        }
        e.dataTransfer.setData('application/teledrive-file', JSON.stringify({
            id: file.id,
            name: file.name,
            path: file.path
        }))
        e.dataTransfer.effectAllowed = 'move'
    }

    // Drop handlers for folders
    const handleDragOver = (e) => {
        if (file.type !== 'folder') return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setIsDragOver(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDropOnFolder = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
        if (file.type !== 'folder') return

        const data = e.dataTransfer.getData('application/teledrive-file')
        if (data) {
            const draggedFile = JSON.parse(data)
            onDrop?.(draggedFile.id, file)
        }
    }

    const IconComponent = FileIcons[file.fileType] || FileIcons.file

    return (
        <div
            className={`file-item ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={(e) => onContextMenu(e, file)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            draggable={file.type !== 'folder'}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropOnFolder}
        >
            <div className="file-icon">
                {shouldShowThumbnail ? (
                    <FileThumbnail file={file} downloadFile={downloadFile} />
                ) : (
                    <IconComponent />
                )}
                {file.encrypted && <span className="encrypted-badge">🔒</span>}
            </div>
            <div className="file-info">
                {isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={handleKeyDown}
                        className="file-name-input"
                    />
                ) : (
                    <span className="file-name" title={file.name}>{file.name}</span>
                )}
            </div>
        </div>
    )
}

function FileListItem({ file, isSelected, onSelect, onOpen, onContextMenu }) {
    const IconComponent = FileIcons[file.fileType] || FileIcons.file

    return (
        <div
            className={`file-list-item ${isSelected ? 'selected' : ''}`}
            onClick={(e) => onSelect(file.id, e.ctrlKey || e.metaKey)}
            onDoubleClick={() => onOpen(file)}
            onContextMenu={(e) => onContextMenu(e, file)}
        >
            <div className="list-icon">
                <IconComponent />
            </div>
            <span className="list-name" title={file.name}>{file.name}</span>
            <span className="list-size">{file.type !== 'folder' ? formatSize(file.size) : '--'}</span>
            <span className="list-date">{formatDate(file.modifiedAt)}</span>
            <span className="list-type">{file.fileType}</span>
        </div>
    )
}

function FileGrid({ onOpenFile, onSelectFile }) {
    const {
        currentFiles,
        viewMode,
        selectedFiles,
        selectFile,
        navigateTo,
        currentPath,
        moveItem
    } = useFileSystem()

    const [contextMenu, setContextMenu] = useState(null)
    const [editingFileId, setEditingFileId] = useState(null)
    const files = currentFiles()

    const handleOpen = useCallback((file) => {
        if (file.type === 'folder') {
            navigateTo(currentPath + file.name + '/')
        } else {
            onOpenFile?.(file)
        }
    }, [navigateTo, currentPath, onOpenFile])

    // Handle file selection - notify parent for preview panel
    const handleSelect = useCallback((file) => {
        selectFile(file.id, false)
        onSelectFile?.(file)
    }, [selectFile, onSelectFile])

    // Handle dropping a file onto a folder
    const handleDropOnFolder = useCallback(async (fileId, targetFolder) => {
        const newPath = currentPath + targetFolder.name + '/'
        await moveItem(fileId, newPath)
    }, [currentPath, moveItem])

    const handleContextMenu = useCallback((e, file) => {
        e.preventDefault()
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            file,
        })
    }, [])

    const closeContextMenu = useCallback(() => {
        setContextMenu(null)
    }, [])

    const handleRename = useCallback((file) => {
        setEditingFileId(file.id)
    }, [])

    const handleEditComplete = useCallback(() => {
        setEditingFileId(null)
    }, [])

    // Close context menu on click outside
    useEffect(() => {
        if (contextMenu) {
            document.addEventListener('click', closeContextMenu)
            return () => document.removeEventListener('click', closeContextMenu)
        }
    }, [contextMenu, closeContextMenu])

    if (files.length === 0) {
        return (
            <div className="empty-folder">
                <div className="empty-icon">📂</div>
                <h3>This folder is empty</h3>
                <p>Drop files here or click Upload to add files</p>
            </div>
        )
    }

    return (
        <div className={`file-container ${viewMode}`}>
            {viewMode === 'grid' ? (
                <div className="file-grid">
                    {files.map(file => (
                        <FileItem
                            key={file.id}
                            file={file}
                            isSelected={selectedFiles.includes(file.id)}
                            onSelect={(fileId) => handleSelect(files.find(f => f.id === fileId) || file)}
                            onOpen={handleOpen}
                            onContextMenu={handleContextMenu}
                            onDrop={handleDropOnFolder}
                            isEditing={editingFileId === file.id}
                            onEditComplete={handleEditComplete}
                        />
                    ))}
                </div>
            ) : (
                <div className="file-list">
                    <div className="list-header">
                        <span className="list-name">Name</span>
                        <span className="list-size">Size</span>
                        <span className="list-date">Modified</span>
                        <span className="list-type">Type</span>
                    </div>
                    {files.map(file => (
                        <FileListItem
                            key={file.id}
                            file={file}
                            isSelected={selectedFiles.includes(file.id)}
                            onSelect={selectFile}
                            onOpen={handleOpen}
                            onContextMenu={handleContextMenu}
                        />
                    ))}
                </div>
            )}

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    file={contextMenu.file}
                    onClose={closeContextMenu}
                    onRename={handleRename}
                />
            )}
        </div>
    )
}

function ContextMenu({ x, y, file, onClose, onRename }) {
    const { deleteItems, downloadFile, navigateTo, currentPath } = useFileSystem()
    const menuRef = useRef(null)

    // Adjust position if menu goes off screen
    useEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight

            if (rect.right > viewportWidth) {
                menuRef.current.style.left = `${x - rect.width}px`
            }
            if (rect.bottom > viewportHeight) {
                menuRef.current.style.top = `${y - rect.height}px`
            }
        }
    }, [x, y])

    const handleOpen = () => {
        if (file.type === 'folder') {
            navigateTo(currentPath + file.name + '/')
        }
        onClose()
    }

    const handleRename = () => {
        onRename?.(file)
        onClose()
    }

    const handleDownload = async () => {
        const buffer = await downloadFile(file.id)
        if (buffer) {
            const blob = new Blob([buffer])
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            a.click()
            URL.revokeObjectURL(url)
        }
        onClose()
    }

    const handleDelete = async () => {
        const itemType = file.type === 'folder' ? 'klasörünü' : 'dosyasını'
        if (confirm(`"${file.name}" ${itemType} silmek istediğinize emin misiniz?`)) {
            await deleteItems([file.id])
        }
        onClose()
    }

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={{ left: x, top: y }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="context-menu-item" onClick={handleRename}>
                <span>✏️</span>
                <span>Yeniden Adlandır</span>
            </div>
            {file.type !== 'folder' && (
                <div className="context-menu-item" onClick={handleDownload}>
                    <span>⬇️</span>
                    <span>İndir</span>
                </div>
            )}
            <div className="context-menu-divider"></div>
            <div className="context-menu-item danger" onClick={handleDelete}>
                <span>🗑️</span>
                <span>Sil</span>
            </div>
        </div>
    )
}

export default FileGrid
export { FileIcons }
