/**
 * TeleDrive - File System Context
 * Manages virtual file system state using Bot API
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

// Lazy load bot service
let botServiceInstance = null
const getBotService = async () => {
    if (!botServiceInstance) {
        const module = await import('../lib/telegramBot')
        botServiceInstance = module.default
    }
    return botServiceInstance
}

const FileSystemContext = createContext(null)

export function FileSystemProvider({ children }) {
    const [files, setFiles] = useState([])
    const [folders, setFolders] = useState([])
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

    // Load all files from local index
    const loadFiles = useCallback(async () => {
        if (loadingRef.current) return
        loadingRef.current = true
        setIsLoading(true)
        setError(null)

        try {
            const botService = await getBotService()
            const [fileList, folderList] = await Promise.all([
                botService.getFiles(),
                botService.getFolders(),
            ])

            setFiles(fileList)
            setFolders(folderList)
        } catch (err) {
            console.error('Load files error:', err)
            setError('Failed to load files')
        } finally {
            setIsLoading(false)
            loadingRef.current = false
        }
    }, [])

    // Get files and folders for current path
    const currentFiles = useCallback(() => {
        // Combine files and folders
        const filesInPath = files.filter(f => f.path === currentPath)
        const foldersInPath = folders.filter(f => f.path === currentPath)

        let result = [
            ...foldersInPath.map(f => ({ ...f, type: 'folder' })),
            ...filesInPath,
        ]

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(f =>
                f.name.toLowerCase().includes(query)
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
                    compare = (a.uploadedAt || a.createdAt || 0) - (b.uploadedAt || b.createdAt || 0)
                    break
                case 'size':
                    compare = (a.size || 0) - (b.size || 0)
                    break
                case 'type':
                    compare = (a.mimeType || '').localeCompare(b.mimeType || '')
                    break
                default:
                    compare = 0
            }

            return sortOrder === 'asc' ? compare : -compare
        })

        return result
    }, [files, folders, currentPath, searchQuery, sortBy, sortOrder])

    // Get folder tree
    const folderTree = useCallback(() => {
        const tree = [{ name: 'Home', path: '/', children: [] }]

        folders.forEach(folder => {
            // Simple flat list for now
            tree[0].children.push({
                name: folder.name,
                path: folder.path + folder.name + '/',
                children: [],
            })
        })

        return tree
    }, [folders])

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
            const botService = await getBotService()
            await botService.createFolder(name, currentPath)
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
        const uploadId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)

        setUploadProgress(prev => ({
            ...prev,
            [uploadId]: { name: file.name, progress: 0, status: 'uploading' }
        }))

        try {
            const botService = await getBotService()

            setUploadProgress(prev => ({
                ...prev,
                [uploadId]: { ...prev[uploadId], progress: 50, status: 'uploading' }
            }))

            await botService.uploadFile(file, currentPath)

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

            setTimeout(() => {
                setUploadProgress(prev => {
                    const { [uploadId]: _, ...rest } = prev
                    return rest
                })
            }, 5000)

            setError(`Failed to upload: ${file.name}`)
            return false
        }
    }, [currentPath, loadFiles])

    // Delete items
    const deleteItems = useCallback(async (fileIds) => {
        try {
            const botService = await getBotService()

            for (const id of fileIds) {
                const file = files.find(f => f.fileId === id || f.id === id)
                if (file) {
                    if (file.isFolder || file.type === 'folder') {
                        await botService.deleteFolder(file.id)
                    } else {
                        await botService.deleteFile(file.fileId, file.id)
                    }
                }
            }

            await loadFiles()
            setSelectedFiles([])
            return true
        } catch (err) {
            console.error('Delete error:', err)
            setError('Failed to delete')
            return false
        }
    }, [files, loadFiles])

    // Download file
    const downloadFile = useCallback(async (fileId) => {
        const file = files.find(f => f.fileId === fileId)
        if (!file) return null

        try {
            const botService = await getBotService()
            const blob = await botService.downloadFile(fileId)
            return blob
        } catch (err) {
            console.error('Download error:', err)
            setError('Failed to download')
            return null
        }
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
        setSelectedFiles(current.map(f => f.fileId || f.id))
    }, [currentFiles])

    const clearSelection = useCallback(() => {
        setSelectedFiles([])
    }, [])

    // Placeholder functions for compatibility
    const renameItem = useCallback(async () => {
        setError('Rename not available with Bot API')
        return false
    }, [])

    const moveItem = useCallback(async () => {
        setError('Move not available with Bot API')
        return false
    }, [])

    const updateTags = useCallback(async () => {
        setError('Tags not available with Bot API')
        return false
    }, [])

    const getAllTags = useCallback(() => [], [])

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
