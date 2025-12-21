/**
 * TeleDrive - Virtual File System
 * Manages folder structure using metadata in message captions
 */

// Metadata prefix to identify TeleDrive managed messages
const METADATA_PREFIX = '📁'
const METADATA_SEPARATOR = '\n---\n'

/**
 * Parse TeleDrive metadata from message caption/text
 */
export function parseMetadata(message) {
    // GramJS stores text in 'message' property, but also check 'text' and 'caption' for media
    const text = message.message || message.text || message.caption || ''

    // Try multiple separator formats (Unix \n, Windows \r\n, or stripped)
    let separatorIndex = text.indexOf('\n---\n')
    if (separatorIndex === -1) {
        separatorIndex = text.indexOf('\r\n---\r\n')
    }
    if (separatorIndex === -1) {
        separatorIndex = text.indexOf('\n---')
    }
    if (separatorIndex === -1) {
        separatorIndex = text.indexOf('}---') // No newline case
        if (separatorIndex !== -1) separatorIndex += 1 // Move past the }
    }

    if (separatorIndex === -1) {
        // Legacy or non-TeleDrive message
        return {
            isManaged: false,
            displayText: text,
            metadata: null,
        }
    }

    try {
        const jsonPart = text.substring(0, separatorIndex)
        // Find where display text starts (after separator and possible newlines)
        let displayStart = separatorIndex + 3 // Skip '---'
        while (displayStart < text.length && (text[displayStart] === '\n' || text[displayStart] === '\r')) {
            displayStart++
        }
        const displayPart = text.substring(displayStart)

        // Parse JSON metadata
        const metadata = JSON.parse(jsonPart)

        if (!metadata._teledrive) {
            return {
                isManaged: false,
                displayText: text,
                metadata: null,
            }
        }

        return {
            isManaged: true,
            displayText: displayPart,
            metadata,
        }
    } catch {
        return {
            isManaged: false,
            displayText: text,
            metadata: null,
        }
    }
}

/**
 * Create metadata string for message caption
 */
export function createMetadata(options) {
    const metadata = {
        _teledrive: true,
        version: 1,
        path: options.path || '/',
        name: options.name,
        type: options.type || 'file', // 'file' | 'folder'
        tags: options.tags || [],
        encrypted: options.encrypted || false,
        createdAt: options.createdAt || new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        ...options.extra,
    }

    const displayText = options.displayText || ''
    return JSON.stringify(metadata) + METADATA_SEPARATOR + displayText
}

/**
 * Update metadata while preserving display text
 */
export function updateMetadata(message, updates) {
    const { metadata, displayText } = parseMetadata(message)

    if (!metadata) {
        throw new Error('Message has no TeleDrive metadata')
    }

    const updatedMetadata = {
        ...metadata,
        ...updates,
        modifiedAt: new Date().toISOString(),
    }

    return JSON.stringify(updatedMetadata) + METADATA_SEPARATOR + displayText
}

/**
 * Get file info from message
 */
export function getFileInfo(message) {
    const { isManaged, metadata, displayText } = parseMetadata(message)

    // Get media info
    let media = null
    let fileType = 'unknown'
    let size = 0
    let mimeType = ''
    let thumbnail = null

    if (message.media) {
        if (message.media.photo) {
            media = message.media.photo
            fileType = 'image'
            mimeType = 'image/jpeg'
            // Get largest photo size
            const sizes = message.media.photo.sizes || []
            const largest = sizes[sizes.length - 1]
            if (largest) {
                size = largest.size || 0
            }
        } else if (message.media.document) {
            media = message.media.document
            mimeType = message.media.document.mimeType || ''
            size = Number(message.media.document.size) || 0

            // Determine file type from mime
            if (mimeType.startsWith('video/')) {
                fileType = 'video'
            } else if (mimeType.startsWith('audio/')) {
                fileType = 'audio'
            } else if (mimeType.startsWith('image/')) {
                fileType = 'image'
            } else if (mimeType === 'application/pdf') {
                fileType = 'pdf'
            } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
                fileType = 'archive'
            } else if (mimeType.includes('word') || mimeType.includes('document')) {
                fileType = 'document'
            } else if (mimeType.includes('sheet') || mimeType.includes('excel')) {
                fileType = 'spreadsheet'
            } else {
                fileType = 'file'
            }

            // Check for thumbnail
            const thumbs = message.media.document.thumbs || []
            if (thumbs.length > 0) {
                thumbnail = thumbs[0]
            }

            // Get original filename
            const attrs = message.media.document.attributes || []
            const fileAttr = attrs.find(a => a.className === 'DocumentAttributeFilename')
            if (fileAttr) {
                const originalName = fileAttr.fileName
                if (!isManaged && !metadata?.name) {
                    return {
                        id: message.id.toString(),
                        messageId: message.id,
                        name: originalName,
                        path: '/',
                        type: 'file',
                        fileType,
                        mimeType,
                        size,
                        thumbnail,
                        media,
                        tags: [],
                        encrypted: false,
                        isManaged: false,
                        createdAt: new Date(message.date * 1000).toISOString(),
                        modifiedAt: new Date(message.date * 1000).toISOString(),
                        message,
                    }
                }
            }
        }
    }

    // If managed, use metadata
    if (isManaged && metadata) {
        return {
            id: message.id.toString(),
            messageId: message.id,
            name: metadata.name,
            path: metadata.path,
            type: metadata.type,
            fileType: metadata.type === 'folder' ? 'folder' : fileType,
            mimeType,
            size,
            thumbnail,
            media,
            tags: metadata.tags || [],
            encrypted: metadata.encrypted || false,
            isManaged: true,
            createdAt: metadata.createdAt,
            modifiedAt: metadata.modifiedAt,
            displayText,
            message,
        }
    }

    // Non-managed file/message
    const name = displayText?.substring(0, 50) || `Message ${message.id}`

    return {
        id: message.id.toString(),
        messageId: message.id,
        name: media ? (message.media.document?.attributes?.[0]?.fileName || `File ${message.id}`) : name,
        path: '/',
        type: media ? 'file' : 'text',
        fileType: media ? fileType : 'text',
        mimeType,
        size,
        thumbnail,
        media,
        tags: [],
        encrypted: false,
        isManaged: false,
        createdAt: new Date(message.date * 1000).toISOString(),
        modifiedAt: new Date(message.date * 1000).toISOString(),
        displayText: displayText || message.message || '',
        message,
    }
}

/**
 * Build folder tree from file list
 */
export function buildFolderTree(files) {
    const tree = {
        '/': {
            name: 'Root',
            path: '/',
            type: 'folder',
            children: [],
        },
    }

    // First pass: create folder nodes from folder items
    const folders = files.filter(f => f.type === 'folder')
    folders.forEach(folder => {
        tree[folder.path + folder.name + '/'] = {
            ...folder,
            children: [],
        }
    })

    // Also create implicit folders from file paths
    files.forEach(file => {
        const parts = file.path.split('/').filter(Boolean)
        let currentPath = '/'

        parts.forEach(part => {
            const nextPath = currentPath + part + '/'
            if (!tree[nextPath]) {
                tree[nextPath] = {
                    name: part,
                    path: currentPath,
                    type: 'folder',
                    children: [],
                    implicit: true,
                }
            }
            currentPath = nextPath
        })
    })

    // Second pass: assign children
    Object.keys(tree).forEach(path => {
        if (path === '/') return

        const parentPath = tree[path].path
        if (tree[parentPath]) {
            tree[parentPath].children.push(tree[path])
        }
    })

    return tree
}

/**
 * Get files in a specific path
 */
export function getFilesInPath(files, path) {
    return files.filter(file => file.path === path)
}

/**
 * Format file size
 */
export function formatSize(bytes) {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date

    // Less than a day
    if (diff < 86400000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Less than a week
    if (diff < 604800000) {
        return date.toLocaleDateString([], { weekday: 'short' })
    }

    // Same year
    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    // Different year
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Get icon name for file type
 */
export function getFileIcon(fileType) {
    const icons = {
        folder: '📁',
        image: '🖼️',
        video: '🎬',
        audio: '🎵',
        pdf: '📕',
        document: '📄',
        spreadsheet: '📊',
        archive: '📦',
        text: '📝',
        file: '📎',
        unknown: '❓',
    }

    return icons[fileType] || icons.unknown
}

export default {
    parseMetadata,
    createMetadata,
    updateMetadata,
    getFileInfo,
    buildFolderTree,
    getFilesInPath,
    formatSize,
    formatDate,
    getFileIcon,
}
