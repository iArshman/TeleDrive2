/**
 * Custom OS polyfill shim for GramJS browser compatibility
 * GramJS uses os.type() to detect the platform for device info
 */

// Detect platform from user agent
function detectPlatform() {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('win')) return 'Windows_NT'
    if (ua.includes('mac')) return 'Darwin'
    if (ua.includes('linux')) return 'Linux'
    if (ua.includes('android')) return 'Android'
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS'
    return 'Browser'
}

function detectArch() {
    return navigator.userAgent.includes('x64') || navigator.userAgent.includes('Win64') ? 'x64' : 'x86'
}

const osShim = {
    type: () => detectPlatform(),
    arch: () => detectArch(),
    platform: () => detectPlatform().toLowerCase(),
    release: () => '1.0.0',
    hostname: () => 'browser',
    homedir: () => '/',
    tmpdir: () => '/tmp',
    cpus: () => [{ model: 'Browser', speed: 0 }],
    totalmem: () => navigator.deviceMemory ? navigator.deviceMemory * 1024 * 1024 * 1024 : 4 * 1024 * 1024 * 1024,
    freemem: () => 2 * 1024 * 1024 * 1024,
    uptime: () => Math.floor(performance.now() / 1000),
    loadavg: () => [0, 0, 0],
    networkInterfaces: () => ({}),
    userInfo: () => ({ username: 'browser', homedir: '/', shell: '' }),
    endianness: () => 'LE',
    EOL: '\n',
}

export default osShim
export const type = osShim.type
export const arch = osShim.arch
export const platform = osShim.platform
export const release = osShim.release
export const hostname = osShim.hostname
export const homedir = osShim.homedir
export const tmpdir = osShim.tmpdir
export const cpus = osShim.cpus
export const totalmem = osShim.totalmem
export const freemem = osShim.freemem
export const uptime = osShim.uptime
export const loadavg = osShim.loadavg
export const networkInterfaces = osShim.networkInterfaces
export const userInfo = osShim.userInfo
export const endianness = osShim.endianness
export const EOL = osShim.EOL
