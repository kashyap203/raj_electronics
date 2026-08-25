/**
 * Issuer Bank Verification Service
 * 
 * Responsible for identifying the issuing bank of a given card based on authoritative sources.
 * 
 * As per strict business requirements and ICICI's API limitations:
 * 1. The ICICI getCardBin API does NOT return the issuing bank.
 * 2. We MUST NOT guess the issuing bank from the card network (Visa, Mastercard, etc.).
 * 3. We MUST NOT use an arbitrary or hardcoded BIN list.
 * 
 * Therefore, this service will return UNAVAILABLE for all lookups until an authoritative
 * integration is available.
 */

export const verifyIssuerBank = async (cardMetadata, cardNumber) => {
  // Currently, no authoritative mechanism is available in ICICI PG for issuer identification
  return {
    status: 'UNAVAILABLE',
    bank: null
  };
};
