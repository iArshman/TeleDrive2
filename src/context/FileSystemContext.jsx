/**
 * TeleDrive - File System Context
 * Manages virtual file system state
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { getFileInfo, createMetadata, updateMetadata, getFilesInPath, buildFolderTree } from '../lib/virtualFS'

// Lazy load telegram service
let telegramServiceInstance = null
const getTelegramService = async () => {
    if (!telegramServiceInstance) {
        const module = await import('../lib/telegram')
        telegramServiceInstance = module.default
    }
    return telegramServiceInstance
}

const FileSystemContext = createContext(null)

export function FileSystemProvider({ children }) {
    const [files, setFiles] = useState([])
    const [currentPath, setCurrentPath] = useState('/')
    const [selectedFiles, setSelectedFiles] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
    const [sortBy, setSortBy] = useState('name') // 'name' | 'date' | 'size' | 'type'
    const [sortOrder, setSortOrder] = useState('asc') // 'asc' | 'desc'
    const [searchQuery, setSearchQuery] = useState('')
    const [filterTags, setFilterTags] = useState([])
    const [uploadProgress, setUploadProgress] = useState({})

    const loadingRef = useRef(false)

    // Load files on mount
    useEffect(() => {
        loadFiles()
    }, [])

    // Load all files from Saved Messages
    const loadFiles = useCallback(async () => {
        if (loadingRef.current) return
        loadingRef.current = true
        setIsLoading(true)
        setError(null)

        try {
            const telegramService = await getTelegramService()
            const messages = await telegramService.getSavedMessages(500)

            const fileList = messages
                .map(msg => getFileInfo(msg))
                .filter(f => f !== null)
                .filter(f => f.isManaged === true)

            setFiles(fileList)
        } catch (err) {
            console.error('Load files error:', err)
            setError('Failed to load files')
        } finally {
            setIsLoading(false)
            loadingRef.current = false
        }
    }, [])

    // Get files for current path
    const currentFiles = useCallback(() => {
        let result = getFilesInPath(files, currentPath)

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(f =>
                f.name.toLowerCase().includes(query) ||
                f.tags?.some(t => t.toLowerCase().includes(query))
            )
        }

        // Apply tag filter
        if (filterTags.length > 0) {
            result = result.filter(f =>
                filterTags.every(tag => f.tags?.includes(tag))
            )
        }

        // Sort
        result.sort((a, b) => {
            // Folders first
            if (a.type === 'folder' && b.type !== 'folder') return -1
            if (a.type !== 'folder' && b.type === 'folder') return 1

            let compare = 0
            switch (sortBy) {
                case 'name':
                    compare = a.name.localeCompare(b.name)
                    break
                case 'date':
                    compare = new Date(a.modifiedAt) - new Date(b.modifiedAt)
                    break
                case 'size':
                    compare = a.size - b.size
                    break
                case 'type':
                    compare = a.fileType.localeCompare(b.fileType)
                    break
                default:
                    compare = 0
            }

            return sortOrder === 'asc' ? compare : -compare
        })

        return result
    }, [files, currentPath, searchQuery, filterTags, sortBy, sortOrder])

    // Get folder tree
    const folderTree = useCallback(() => {
        return buildFolderTree(files)
    }, [files])

    // Navigate to path
    const navigateTo = useCallback((path) => {
        setCurrentPath(path)
        setSelectedFiles([])
    }, [])

    // Navigate up
    const navigateUp = useCallback(() => {
        if (currentPath === '/') return
        const parts = currentPath.split('/').filter(Boolean)
        parts.pop()
        setCurrentPath('/' + parts.join('/') + (parts.length > 0 ? '/' : ''))
        setSelectedFiles([])
    }, [currentPath])

    // Get breadcrumb parts
    const getBreadcrumbs = useCallback(() => {
        const parts = currentPath.split('/').filter(Boolean)
        const breadcrumbs = [{ name: 'Home', path: '/' }]

        let path = '/'
        parts.forEach(part => {
            path += part + '/'
            breadcrumbs.push({ name: part, path })
        })

        return breadcrumbs
    }, [currentPath])

    // Create folder
    const createFolder = useCallback(async (name) => {
        setError(null)
        try {
            const telegramService = await getTelegramService()
            const metadata = createMetadata({
                path: currentPath,
                name,
                type: 'folder',
            })

            await telegramService.sendMessage(metadata)
            await loadFiles()
            return true
        } catch (err) {
            console.error('Create folder error:', err)
            setError('Failed to create folder')
            return false
        }
    }, [currentPath, loadFiles])

    // Upload file
    const uploadFile = useCallback(async (file, options = {}) => {
        const uploadId = Date.now().toString()
        setUploadProgress(prev => ({
            ...prev,
            [uploadId]: { name: file.name, progress: 0, status: 'uploading' }
        }))

        try {
            const telegramService = await getTelegramService()

            // Generate UUID filename while keeping original extension
            const extension = file.name.includes('.') ? '.' + file.name.split('.').pop() : ''
            const uuid = crypto.randomUUID()
            const uniqueName = uuid + extension

            const metadata = createMetadata({
                path: currentPath,
                name: uniqueName,
                type: 'file',
                tags: options.tags || [],
                encrypted: options.encrypted || false,
                originalName: file.name, // Store original name in metadata
            })

            const progressCallback = (progress) => {
                const percent = Math.round(progress * 100)
                setUploadProgress(prev => ({
                    ...prev,
                    [uploadId]: { ...prev[uploadId], progress: percent }
                }))
            }

            // Determine if it's a photo
            const isPhoto = file.type.startsWith('image/') && !options.forceDocument

            if (isPhoto) {
                await telegramService.sendPhoto(file, metadata, progressCallback)
            } else {
                await telegramService.sendFile(file, metadata, progressCallback)
            }

            setUploadProgress(prev => ({
                ...prev,
                [uploadId]: { ...prev[uploadId], progress: 100, status: 'complete' }
            }))

            // Remove from progress after delay
            setTimeout(() => {
                setUploadProgress(prev => {
                    const { [uploadId]: _, ...rest } = prev
                    return rest
                })
            }, 2000)

            await loadFiles()
            return true
        } catch (err) {
            console.error('Upload error:', err)
            setUploadProgress(prev => ({
                ...prev,
                [uploadId]: { ...prev[uploadId], status: 'error', error: err.message }
            }))
            setError('Failed to upload file')
            return false
        }
    }, [currentPath, loadFiles])

    // Rename file/folder
    const renameItem = useCallback(async (fileId, newName) => {
        const file = files.find(f => f.id === fileId)
        if (!file) return false

        try {
            const telegramService = await getTelegramService()
            if (file.isManaged) {
                const newCaption = updateMetadata(file.message, { name: newName })
                await telegramService.editMessageCaption(file.messageId, newCaption)
            } else {
                // Convert to managed file
                const metadata = createMetadata({
                    path: file.path,
                    name: newName,
                    type: file.type,
                    displayText: file.displayText,
                })
                await telegramService.editMessageCaption(file.messageId, metadata)
            }

            await loadFiles()
            return true
        } catch (err) {
            console.error('Rename error:', err)
            setError('Failed to rename')
            return false
        }
    }, [files, loadFiles])

    // Move item to new path
    const moveItem = useCallback(async (fileId, newPath) => {
        const file = files.find(f => f.id === fileId)
        if (!file) return false

        try {
            const telegramService = await getTelegramService()
            if (file.isManaged) {
                const newCaption = updateMetadata(file.message, { path: newPath })
                await telegramService.editMessageCaption(file.messageId, newCaption)
            } else {
                const metadata = createMetadata({
                    path: newPath,
                    name: file.name,
                    type: file.type,
                    displayText: file.displayText,
                })
                await telegramService.editMessageCaption(file.messageId, metadata)
            }

            await loadFiles()
            return true
        } catch (err) {
            console.error('Move error:', err)
            setError('Failed to move')
            return false
        }
    }, [files, loadFiles])

    // Delete items
    const deleteItems = useCallback(async (fileIds) => {
        try {
            const telegramService = await getTelegramService()
            const messageIds = fileIds.map(id => {
                const file = files.find(f => f.id === id)
                return file?.messageId
            }).filter(Boolean)

            if (messageIds.length > 0) {
                await telegramService.deleteMessages(messageIds)
                await loadFiles()
            }

            setSelectedFiles([])
            return true
        } catch (err) {
            console.error('Delete error:', err)
            setError('Failed to delete')
            return false
        }
    }, [files, loadFiles])

    // Update tags
    const updateTags = useCallback(async (fileId, tags) => {
        const file = files.find(f => f.id === fileId)
        if (!file) return false

        try {
            const telegramService = await getTelegramService()
            if (file.isManaged) {
                const newCaption = updateMetadata(file.message, { tags })
                await telegramService.editMessageCaption(file.messageId, newCaption)
            } else {
                const metadata = createMetadata({
                    path: file.path,
                    name: file.name,
                    type: file.type,
                    tags,
                    displayText: file.displayText,
                })
                await telegramService.editMessageCaption(file.messageId, metadata)
            }

            await loadFiles()
            return true
        } catch (err) {
            console.error('Update tags error:', err)
            setError('Failed to update tags')
            return false
        }
    }, [files, loadFiles])

    // Download file
    const downloadFile = useCallback(async (fileId, progressCallback) => {
        const file = files.find(f => f.id === fileId)
        if (!file || !file.media) return null

        try {
            const telegramService = await getTelegramService()
            const buffer = await telegramService.downloadMedia(file.message, progressCallback)
            return buffer
        } catch (err) {
            console.error('Download error:', err)
            setError('Failed to download')
            return null
        }
    }, [files])

    // Get all unique tags
    const getAllTags = useCallback(() => {
        const tagSet = new Set()
        files.forEach(f => {
            f.tags?.forEach(t => tagSet.add(t))
        })
        return Array.from(tagSet).sort()
    }, [files])

    // Selection handlers
    const selectFile = useCallback((fileId, multi = false) => {
        if (multi) {
            setSelectedFiles(prev =>
                prev.includes(fileId)
                    ? prev.filter(id => id !== fileId)
                    : [...prev, fileId]
            )
        } else {
            setSelectedFiles([fileId])
        }
    }, [])

    const selectAll = useCallback(() => {
        const current = currentFiles()
        setSelectedFiles(current.map(f => f.id))
    }, [currentFiles])

    const clearSelection = useCallback(() => {
        setSelectedFiles([])
    }, [])

    const value = {
        files,
        currentPath,
        selectedFiles,
        isLoading,
        error,
        viewMode,
        sortBy,
        sortOrder,
        searchQuery,
        filterTags,
        uploadProgress,

        currentFiles,
        folderTree,
        getBreadcrumbs,
        getAllTags,

        loadFiles,
        navigateTo,
        navigateUp,
        createFolder,
        uploadFile,
        renameItem,
        moveItem,
        deleteItems,
        updateTags,
        downloadFile,

        selectFile,
        selectAll,
        clearSelection,

        setViewMode,
        setSortBy,
        setSortOrder,
        setSearchQuery,
        setFilterTags,
        setError,
    }

    return (
        <FileSystemContext.Provider value={value}>
            {children}
        </FileSystemContext.Provider>
    )
}

export function useFileSystem() {
    const context = useContext(FileSystemContext)
    if (!context) {
        throw new Error('useFileSystem must be used within a FileSystemProvider')
    }
    return context
}

export default FileSystemContext
