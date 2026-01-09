import FingerprintJS from '@fingerprintjs/fingerprintjs';

// Device types
export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export interface DeviceInfo {
  browser: string;
  os: string;
  device_type: DeviceType;
  device_name: string;
}

export interface DeviceData extends DeviceInfo {
  fingerprint_hash: string;
}

// Get device info from user agent
export const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) {
    browser = 'Chrome';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
  } else if (ua.includes('Edg')) {
    browser = 'Edge';
  } else if (ua.includes('OPR') || ua.includes('Opera')) {
    browser = 'Opera';
  }
  
  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows NT 10')) os = 'Windows 10';
  else if (ua.includes('Windows NT 11')) os = 'Windows 11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  // Detect device type
  let device_type: DeviceType = 'desktop';
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
    device_type = 'mobile';
  } else if (/iPad|Tablet/i.test(ua)) {
    device_type = 'tablet';
  }
  
  return {
    browser,
    os,
    device_type,
    device_name: `${browser} on ${os}`,
  };
};

// Generate unique fingerprint hash
export const getDeviceFingerprint = async (): Promise<string> => {
  // Check for existing fingerprint
  const existing = localStorage.getItem('device_fingerprint');
  if (existing) {
    return existing;
  }

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const fingerprint = result.visitorId;
    
    localStorage.setItem('device_fingerprint', fingerprint);
    return fingerprint;
  } catch (error) {
    // Fallback: generate a random fingerprint
    const fallbackFingerprint = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('device_fingerprint', fallbackFingerprint);
    return fallbackFingerprint;
  }
};

// Get complete device data for API calls
export const getDeviceData = async (): Promise<DeviceData> => {
  const deviceInfo = getDeviceInfo();
  const fingerprintHash = await getDeviceFingerprint();
  
  return {
    fingerprint_hash: fingerprintHash,
    device_type: deviceInfo.device_type,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    device_name: deviceInfo.device_name,
  };
};

// Clear device fingerprint (on logout from all devices)
export const clearDeviceFingerprint = (): void => {
  localStorage.removeItem('device_fingerprint');
};
