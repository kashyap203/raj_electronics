/**
 * Safe monetary calculations — amounts stored in rupees (Number),
 * Pine Labs API amounts in paise (integer).
 */

export const rupeesToPaise = (rupees) => Math.round(Number(rupees) * 100);

export const paiseToRupees = (paise) => Math.round(Number(paise)) / 100;

export const roundMoney = (amount) => Math.round(Number(amount) * 100) / 100;

export const calculatePercentageDiscount = (amount, percentage, maxDiscount = Infinity) => {
  const raw = (Number(amount) * Number(percentage)) / 100;
  return roundMoney(Math.min(raw, maxDiscount));
};

export const calculateFixedDiscount = (amount, discountValue) => {
  return roundMoney(Math.min(Number(discountValue), Number(amount)));
};
