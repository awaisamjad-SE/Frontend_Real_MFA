import api from './api';
import { ENDPOINTS } from '@/config/api';
import { DeviceData } from '@/utils/fingerprint';

// Types
export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role: 'user' | 'manager' | 'admin';
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  status: 'success' | 'mfa_required' | 'device_verification_required' | 'email_not_verified' | 'error';
  tokens?: AuthTokens;
  user?: User;
  device?: { id: string; name?: string; is_trusted: boolean };
  user_id?: string;
  fingerprint_hash?: string;
  message?: string;
  email_hint?: string;
  otp_expires_at?: string;
}

export interface Device {
  id: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  ip_address: string;
  country?: string;
  city?: string;
  is_verified: boolean;
  is_trusted: boolean;
  is_current: boolean;
  total_logins: number;
  risk_score: number;
  first_used_at: string;
  last_used_at: string;
  trust_expires_at?: string;
}

export interface Session {
  id: string;
  device_name: string;
  device_type: string;
  browser: string;
  os: string;
  ip_address: string;
  user_agent: string;
  country?: string;
  city?: string;
  is_active: boolean;
  is_current: boolean;
  last_activity: string;
  created_at: string;
  expires_at: string;
}

export interface TOTPStatus {
  mfa_enabled: boolean;
  backup_codes_remaining: number;
  last_used?: string;
}

export interface TOTPSetupResponse {
  secret: string;
  qr_code: string;
  manual_entry?: string;
}

// Admin MFA types (shapes depend on backend; use generic types for now)
export interface AdminMfaDetails extends Record<string, unknown> {}
export interface AdminMfaAuditEvent extends Record<string, unknown> {}
export interface AdminMfaComplianceReport extends Record<string, unknown> {}

export interface AdminUserSummary {
  id: string;
  email: string;
  username: string;
  role: string;
  is_deleted?: boolean;
  mfa_enabled?: boolean;
  last_login?: string | null;
}

export interface AdminUserListResponse {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  summary?: {
    total_users: number;
    active_users: number;
    locked_users: number;
    mfa_enabled: number;
    unverified_emails: number;
    deleted_users: number;
  };
  users: AdminUserSummary[];
}

// Authentication APIs
export const authService = {
  register: async (data: {
    email: string;
    username: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
    device: {
      fingerprint_hash: string;
      device_type: string;
      browser: string;
      os: string;
      device_name: string;
    };
  }) => {
    const response = await api.post(ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  },

  login: async (data: {
    identifier: string;
    password: string;
    device?: {
      fingerprint_hash: string;
      device_type: string;
      browser: string;
      os: string;
      device_name: string;
    };
    device_fingerprint?: string;
    device_name?: string;
    device_type?: string;
    browser?: string;
    os?: string;
  }): Promise<LoginResponse> => {
    const response = await api.post(ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await api.post(ENDPOINTS.AUTH.LOGOUT, { refresh: refreshToken });
    return response.data;
  },

  verifyMFA: async (data: {
    user_id: string;
    fingerprint_hash: string;
    totp_code?: string;
    backup_code?: string;
    trust_device?: boolean;
    trust_days?: number;
  }): Promise<LoginResponse> => {
    const response = await api.post(ENDPOINTS.AUTH.VERIFY_MFA, data);
    return response.data;
  },
};

// Device APIs
export const deviceService = {
  list: async (): Promise<{ count: number; devices: Device[] }> => {
    const response = await api.get(ENDPOINTS.DEVICES.LIST);
    return response.data;
  },

  verify: async (data: {
    user_id: string;
    otp_code: string;
    fingerprint_hash: string;
    trust_device?: boolean;
    trust_days?: number;
  }): Promise<LoginResponse> => {
    const response = await api.post(ENDPOINTS.DEVICES.VERIFY, data);
    return response.data;
  },

  revoke: async (deviceId: string) => {
    const response = await api.post(ENDPOINTS.DEVICES.REVOKE(deviceId));
    return response.data;
  },
};

// Session APIs
export const sessionService = {
  list: async (): Promise<{ count: number; sessions: Session[] }> => {
    const response = await api.get(ENDPOINTS.SESSIONS.LIST);
    // Backend returns { count: n, sessions: [...] } directly
    return response.data;
  },

  revoke: async (sessionId: string) => {
    const response = await api.post(ENDPOINTS.SESSIONS.REVOKE(sessionId));
    return response.data;
  },

  revokeAll: async (includeCurrent: boolean = false) => {
    const response = await api.post(ENDPOINTS.SESSIONS.REVOKE_ALL, {
      include_current: includeCurrent,
    });
    return response.data;
  },
};

// TOTP APIs
export const totpService = {
  getStatus: async (): Promise<TOTPStatus> => {
    const response = await api.get(ENDPOINTS.TOTP.STATUS);
    return response.data;
  },

  setup: async (password: string): Promise<TOTPSetupResponse> => {
    const response = await api.post(ENDPOINTS.TOTP.SETUP, { password });
    return response.data;
  },

  verify: async (code: string): Promise<{ backup_codes: string[] }> => {
    const response = await api.post(ENDPOINTS.TOTP.VERIFY, { code });
    return response.data;
  },

  disable: async (password: string) => {
    const response = await api.post(ENDPOINTS.TOTP.DISABLE, { password });
    return response.data;
  },

  regenerateBackupCodes: async (password: string): Promise<{ backup_codes: string[] }> => {
    const response = await api.post(ENDPOINTS.TOTP.REGENERATE_BACKUP, { password });
    return response.data;
  },
};

// Email Verification APIs
export const emailService = {
  // POST /api/notifications/verify-email/ with { uid, token }
  verify: async (uid: string, token: string) => {
    const response = await api.post(ENDPOINTS.NOTIFICATIONS.VERIFY_EMAIL, {
      uid,
      token,
    });
    return response.data;
  },

  // POST /api/notifications/resend-verification-email/ with { email }
  // Rate limited: 60s cooldown, max 4 per hour
  resendVerification: async (email: string) => {
    const response = await api.post(ENDPOINTS.NOTIFICATIONS.RESEND_VERIFICATION, {
      email,
    });
    return response.data;
  },
};

// Password APIs
export const passwordService = {
  forgot: async (email: string) => {
    const response = await api.post(ENDPOINTS.PASSWORD.FORGOT, { email });
    return response.data;
  },

  reset: async (data: {
    reset_token?: string;
    user_id?: string;
    otp_code: string;
    new_password: string;
    new_password_confirm: string;
    new_password2?: string;
  }) => {
    const response = await api.post(ENDPOINTS.PASSWORD.RESET, data);
    return response.data;
  },

  change: async (data: {
    current_password: string;
    new_password: string;
    new_password_confirm: string;
  }) => {
    const response = await api.post(ENDPOINTS.PASSWORD.CHANGE, data);
    return response.data;
  },
};

// Profile APIs
export const profileService = {
  get: async (): Promise<User> => {
    const response = await api.get(ENDPOINTS.PROFILE.ME);
    return response.data;
  },

  update: async (data: Partial<User>): Promise<User> => {
    const response = await api.put(ENDPOINTS.PROFILE.ME, data);
    return response.data;
  },
};

// Admin Users (admin-dashboard) APIs
export const adminUsersService = {
  list: async (page: number, pageSize: number = 10): Promise<AdminUserListResponse> => {
    const response = await api.get(ENDPOINTS.ADMIN.USERS.LIST, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  get: async (userId: string): Promise<AdminUserSummary> => {
    const response = await api.get(ENDPOINTS.ADMIN.USERS.DETAIL(userId));
    return response.data;
  },

  softDelete: async (userId: string): Promise<unknown> => {
    const response = await api.delete(ENDPOINTS.ADMIN.USERS.SOFT_DELETE(userId));
    return response.data;
  },

  restore: async (userId: string): Promise<unknown> => {
    const response = await api.post(ENDPOINTS.ADMIN.USERS.RESTORE(userId), {});
    return response.data;
  },
};

// Admin MFA Management APIs
export const adminMfaService = {
  // Per-user MFA management
  getUserMfaDetails: async (userId: string): Promise<AdminMfaDetails> => {
    const response = await api.get(ENDPOINTS.ADMIN.USER_MFA.DETAILS(userId));
    return response.data;
  },

  resetUserMfa: async (
    userId: string,
    payload: { reason?: string; notify_user?: boolean } = {},
  ): Promise<unknown> => {
    const response = await api.post(ENDPOINTS.ADMIN.USER_MFA.RESET(userId), payload);
    return response.data;
  },

  forceEnableMfa: async (
    userId: string,
    payload: { method: string; reason?: string },
  ): Promise<unknown> => {
    const response = await api.post(ENDPOINTS.ADMIN.USER_MFA.FORCE_ENABLE(userId), payload);
    return response.data;
  },

  forceDisableMfa: async (
    userId: string,
    payload: { reason?: string } = {},
  ): Promise<unknown> => {
    const response = await api.post(ENDPOINTS.ADMIN.USER_MFA.FORCE_DISABLE(userId), payload);
    return response.data;
  },

  generateEmergencyCodes: async (userId: string): Promise<unknown> => {
    const response = await api.post(ENDPOINTS.ADMIN.USER_MFA.EMERGENCY_CODES(userId), {});
    return response.data;
  },

  revokeTrustedDevices: async (userId: string): Promise<unknown> => {
    const response = await api.post(ENDPOINTS.ADMIN.USER_MFA.REVOKE_DEVICES(userId), {});
    return response.data;
  },

  getUserMfaAuditHistory: async (userId: string): Promise<AdminMfaAuditEvent[]> => {
    const response = await api.get(ENDPOINTS.ADMIN.USER_MFA.AUDIT_HISTORY(userId));
    return response.data;
  },

  emergencyBypass: async (
    userId: string,
    payload: { duration_hours: number; reason?: string },
  ): Promise<unknown> => {
    const response = await api.post(ENDPOINTS.ADMIN.USER_MFA.EMERGENCY_BYPASS(userId), payload);
    return response.data;
  },

  // Global MFA management
  getComplianceReport: async (): Promise<AdminMfaComplianceReport> => {
    const response = await api.get(ENDPOINTS.ADMIN.MFA.COMPLIANCE_REPORT);
    return response.data;
  },

  bulkEnableMfa: async (userIds: string[], method: string, reason?: string): Promise<unknown> => {
    const response = await api.post(ENDPOINTS.ADMIN.MFA.BULK_ENABLE, {
      user_ids: userIds,
      method,
      reason,
    });
    return response.data;
  },

  bulkDisableMfa: async (userIds: string[], reason?: string): Promise<unknown> => {
    const response = await api.post(ENDPOINTS.ADMIN.MFA.BULK_DISABLE, {
      user_ids: userIds,
      reason,
    });
    return response.data;
  },

  getPolicy: async (): Promise<unknown> => {
    const response = await api.get(ENDPOINTS.ADMIN.MFA.POLICY);
    return response.data;
  },

  updatePolicy: async (policy: unknown): Promise<unknown> => {
    const response = await api.post(ENDPOINTS.ADMIN.MFA.POLICY, policy);
    return response.data;
  },
};

// OTP APIs
export const otpService = {
  resendDevice: async (userId: string, fingerprintHash: string) => {
    const response = await api.post(ENDPOINTS.OTP.RESEND_DEVICE, { 
      user_id: userId,
      fingerprint_hash: fingerprintHash 
    });
    return response.data;
  },
};
