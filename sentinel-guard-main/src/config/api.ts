// API Configuration
// Use environment variable in production (Vercel) and fall back to local dev URL.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/auth/register/',
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',
    VERIFY_MFA: '/auth/verify-mfa/',
    REFRESH: '/token/refresh/',
  },
  
  // Devices & Sessions
  DEVICES: {
    LIST: '/devices/',
    VERIFY: '/devices/verify/',
    REVOKE: (deviceId: string) => `/devices/${deviceId}/revoke/`,
  },
  
  SESSIONS: {
    LIST: '/devices/sessions/',
    REVOKE: (sessionId: string) => `/devices/sessions/${sessionId}/revoke/`,
    REVOKE_ALL: '/devices/sessions/revoke-all/',
  },
  
  // TOTP/MFA
  TOTP: {
    STATUS: '/totp/status/',
    SETUP: '/totp/setup/',
    VERIFY: '/totp/verify/',
    DISABLE: '/totp/disable/',
    REGENERATE_BACKUP: '/totp/regenerate-backup-codes/',
  },
  
  // Email Verification
  NOTIFICATIONS: {
    VERIFY_EMAIL: '/notifications/verify-email/',
    RESEND_VERIFICATION: '/notifications/resend-verification-email/',
  },
  
  // Password
  PASSWORD: {
    FORGOT: '/password/forgot/',
    RESET: '/password/reset/',
    CHANGE: '/profile/change-password/',
  },
  
  // Profile
  PROFILE: {
    ME: '/profile/me/',
  },
  
  // OTP
  OTP: {
    RESEND_DEVICE: '/otp/resend-device/',
  },

  // Admin dashboard (users & MFA)
  ADMIN: {
    USERS: {
      LIST: '/admin-dashboard/users/',
      DETAIL: (userId: string) => `/admin-dashboard/users/${userId}/`,
      SOFT_DELETE: (userId: string) => `/admin-dashboard/users/${userId}/delete/`,
      RESTORE: (userId: string) => `/admin-dashboard/users/${userId}/restore/`,
    },
    USER_MFA: {
      DETAILS: (userId: string) => `/admin-dashboard/users/${userId}/mfa/`,
      RESET: (userId: string) => `/admin-dashboard/users/${userId}/mfa/reset/`,
      FORCE_ENABLE: (userId: string) => `/admin-dashboard/users/${userId}/mfa/force-enable/`,
      FORCE_DISABLE: (userId: string) => `/admin-dashboard/users/${userId}/mfa/force-disable/`,
      EMERGENCY_CODES: (userId: string) => `/admin-dashboard/users/${userId}/mfa/emergency-codes/`,
      REVOKE_DEVICES: (userId: string) => `/admin-dashboard/users/${userId}/mfa/revoke-devices/`,
      AUDIT_HISTORY: (userId: string) => `/admin-dashboard/users/${userId}/mfa/audit-history/`,
      EMERGENCY_BYPASS: (userId: string) => `/admin-dashboard/users/${userId}/mfa/emergency-bypass/`,
    },
    MFA: {
      COMPLIANCE_REPORT: '/admin-dashboard/mfa/compliance-report/',
      BULK_ENABLE: '/admin-dashboard/mfa/bulk-enable/',
      BULK_DISABLE: '/admin-dashboard/mfa/bulk-disable/',
      POLICY: '/admin-dashboard/mfa/policy/', // GET/POST
    },
  },
} as const;
