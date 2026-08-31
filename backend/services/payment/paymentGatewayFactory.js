import PineLabsGateway from './PineLabsGateway.js';

const gateways = {
  pinelabs: new PineLabsGateway(),
};

export const getPaymentGateway = (name = 'pinelabs') => {
  const gateway = gateways[name.toLowerCase()];
  if (!gateway) {
    throw new Error(`Payment gateway not found: ${name}`);
  }
  return gateway;
};

export const getActivePaymentGateway = () => getPaymentGateway('pinelabs');
