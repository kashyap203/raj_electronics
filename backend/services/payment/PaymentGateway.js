import { randomUUID } from 'crypto';

/**
 * Payment gateway abstraction.
 * Active gateway: PineLabsGateway
 */
export class PaymentGateway {
  get name() {
    throw new Error('Not implemented');
  }

  async createPayment() {
    throw new Error('Not implemented');
  }

  async verifyPayment() {
    throw new Error('Not implemented');
  }

  async getPaymentStatus() {
    throw new Error('Not implemented');
  }

  async handleReturn() {
    throw new Error('Not implemented');
  }

  async handleWebhook() {
    throw new Error('Not implemented');
  }

  async refundPayment() {
    throw new Error('Not implemented');
  }
}

export const generateRequestId = () => randomUUID();

export const generateRequestTimestamp = () => new Date().toISOString();
