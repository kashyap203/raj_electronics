/**
 * Pine Labs / Plural Online configuration.
 * Credentials must remain server-side only.
 */
export const getPineLabsConfig = () => {
  const env = (process.env.PINE_LABS_ENV || 'uat').toLowerCase();
  const isProduction = env === 'production' || env === 'prod';

  return {
    env,
    isProduction,
    mid: process.env.PINE_LABS_MID,
    clientId: process.env.PINE_LABS_CLIENT_ID,
    clientSecret: process.env.PINE_LABS_CLIENT_SECRET,
    signatureKey: process.env.PINE_LABS_SIGNATURE_KEY,
    returnUrl: process.env.PINE_LABS_RETURN_URL,
    webhookUrl: process.env.PINE_LABS_WEBHOOK_URL,
    baseUrl: isProduction
      ? 'https://api.pluralonline.com'
      : 'https://pluraluat.v2.pinepg.in',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  };
};

export const validatePineLabsConfig = () => {
  const config = getPineLabsConfig();
  const missing = [];

  if (!config.mid) missing.push('PINE_LABS_MID');
  if (!config.clientId) missing.push('PINE_LABS_CLIENT_ID');
  if (!config.clientSecret) missing.push('PINE_LABS_CLIENT_SECRET');

  return { valid: missing.length === 0, missing, config };
};

/** Pine Labs WAF blocks localhost/http callback URLs — must be public HTTPS for callbacks. */
export const isBlockedCallbackUrl = (url) => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return true;
    if (parsed.protocol !== 'https:') return true;
    return false;
  } catch {
    return true;
  }
};

export const resolvePineLabsCallbackUrl = () => {
  const config = getPineLabsConfig();
  const publicBase = process.env.PINE_LABS_PUBLIC_URL?.replace(/\/$/, '');

  if (publicBase && !isBlockedCallbackUrl(publicBase)) {
    return `${publicBase}/api/payment/pinelabs/return`;
  }

  if (config.returnUrl && !isBlockedCallbackUrl(config.returnUrl)) {
    return config.returnUrl;
  }

  return null;
};
