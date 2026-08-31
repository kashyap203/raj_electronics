import crypto from 'crypto';

/**
 * Verify Pine Labs callback/webhook signature.
 * Per Pine Labs docs: sort key-value pairs lexicographically, join with &,
 * then HMAC-SHA256 with hex-decoded secret_key.
 */
export const buildSignaturePayload = (params) => {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .sort(([a], [b]) => a.localeCompare(b));

  return entries.map(([key, value]) => `${key}=${value}`).join('&');
};

export const generatePineLabsSignature = (payloadString, secretKeyHex) => {
  if (!payloadString || !secretKeyHex) return '';

  const keyBuffer = Buffer.from(secretKeyHex, 'hex');
  return crypto
    .createHmac('sha256', keyBuffer)
    .update(payloadString, 'utf8')
    .digest('hex')
    .toUpperCase();
};

export const verifyPineLabsSignature = (params, receivedSignature, secretKeyHex) => {
  if (!receivedSignature || !secretKeyHex) return false;

  const payloadString = buildSignaturePayload(params);
  const expected = generatePineLabsSignature(payloadString, secretKeyHex);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(String(receivedSignature).toUpperCase(), 'utf8')
    );
  } catch {
    return expected === String(receivedSignature).toUpperCase();
  }
};
