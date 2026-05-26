// Points to the production cloud backend or falls back to the HTTPS backend locally.
// In local development when accessed from another device on the LAN,
// window.location.hostname automatically resolves to the server's IP address.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `https://${window.location.hostname}:5443`;