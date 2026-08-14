import crypto from 'crypto';

/**
 * Generate HMAC SHA256 Hash for ICICI Bank Orange PG
 * @param {Object} params - The request or response parameters
 * @param {String} secretKey - The ICICI merchant hash key
 * @returns {String} Lowercase hex hash
 */
export const generateICICIHash = (params, secretKey) => {
  if (!secretKey) {
    throw new Error('ICICI_HASH_KEY is missing');
  }

  // 1. Take non-null and non-empty parameters
  // 2. Sort parameters by parameter name in ascending order
  const sortedKeys = Object.keys(params)
    .filter((key) => {
      const val = params[key];
      return val !== null && val !== undefined && val !== '' && key !== 'secureHash';
    })
    .sort();

  // 3. Concatenate parameter value in ascending order of parameter names
  const concatenatedString = sortedKeys.reduce((acc, key) => {
    return acc + String(params[key]);
  }, '');

  // 4. Generate HMAC-SHA256
  // 5. Convert to hexadecimal
  // 6. Convert to lowercase
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(concatenatedString, 'utf-8')
    .digest('hex')
    .toLowerCase();

  return hash;
};

export const generateICICIV2Hash = (params, secretKey) => {
  if (!secretKey) throw new Error('ICICI_HASH_KEY is missing');
  
  // Clone to avoid mutating original, remove secureHash if present
  const payload = { ...params };
  delete payload.secureHash;

  const hashInput = JSON.stringify(payload);
  
  console.log("HASH INPUT STRING:");
  console.log(hashInput);

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(hashInput, 'utf-8')
    .digest('hex')
    .toLowerCase();

  console.log("GENERATED HASH:");
  console.log(hash);
  
  return hash;
};

/**
 * Verify HMAC SHA256 Hash for ICICI Bank Orange PG Response
 * @param {Object} params - The response parameters
 * @param {String} receivedHash - The secureHash received in response
 * @param {String} secretKey - The ICICI merchant hash key
 * @returns {Boolean} True if valid
 */
export const verifyICICIHash = (params, receivedHash, secretKey) => {
  if (!receivedHash) return false;
  
  const generatedHash = generateICICIHash(params, secretKey);
  return generatedHash === receivedHash.toLowerCase();
};
