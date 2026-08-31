import Offer from '../models/Offer.js';
import ProductBankDiscount from '../models/ProductBankDiscount.js';
import Coupon from '../models/Coupon.js';
import DeliveryCity from '../models/DeliveryCity.js';
import { roundMoney, calculatePercentageDiscount, calculateFixedDiscount } from '../utils/moneyUtils.js';

const SUPPORTED_BANKS = ['HDFC', 'SBI', 'ICICI'];

const getDiscountedPrice = (price, discount) =>
  roundMoney(price - (price * (discount || 0)) / 100);

/**
 * Authoritative checkout amount calculation.
 * All amounts in rupees.
 */
export const calculateCheckoutTotals = async ({
  cartItems,
  couponCode,
  userId,
  address,
  isOnlinePayment = true,
}) => {
  let subtotal = 0;
  let bankDiscount = 0;
  const lineItems = [];

  for (const item of cartItems) {
    const product = item.product;
    if (!product) continue;

    const unitPrice = getDiscountedPrice(product.price, product.discount);
    const itemSubtotal = roundMoney(unitPrice * item.quantity);
    subtotal += itemSubtotal;

    let itemBankDiscount = 0;

    if (isOnlinePayment) {
      if (item.appliedOffer) {
        itemBankDiscount = calculateOfferDiscount(item.appliedOffer, itemSubtotal);
      } else if (item.appliedBankDiscount) {
        const bd = item.appliedBankDiscount;
        if (bd.isActive !== false) {
          if (!bd.minTransactionAmount || itemSubtotal >= bd.minTransactionAmount) {
            if (bd.discountType === 'amount') {
              itemBankDiscount = calculateFixedDiscount(itemSubtotal, bd.discountValue);
            } else {
              itemBankDiscount = calculatePercentageDiscount(
                itemSubtotal,
                bd.discountValue,
                bd.maxDiscountAmount || Infinity
              );
            }
          }
        }
      }
    }

    bankDiscount += itemBankDiscount;

    lineItems.push({
      productId: product._id,
      name: product.name,
      unitPrice,
      quantity: item.quantity,
      itemSubtotal,
      itemBankDiscount,
      appliedOffer: item.appliedOffer?._id || item.appliedOffer || null,
      appliedBankDiscount: item.appliedBankDiscount?._id || item.appliedBankDiscount || null,
    });
  }

  subtotal = roundMoney(subtotal);
  bankDiscount = roundMoney(bankDiscount);

  let couponDiscount = 0;
  let validatedCoupon = null;

  if (couponCode) {
    const couponResult = await validateCoupon(couponCode, subtotal, userId);
    if (couponResult.valid) {
      couponDiscount = couponResult.discountAmount;
      validatedCoupon = couponResult.coupon;
    }
  } else if (couponCode === 'DISCOUNT10') {
    couponDiscount = roundMoney(subtotal * 0.1);
  }

  let shipping = 99;
  if (address?.city) {
    const isFreeDelivery = await DeliveryCity.findOne({
      cityName: { $regex: new RegExp(`^${address.city.trim()}$`, 'i') },
    });
    if (isFreeDelivery) shipping = 0;
  }

  const total = roundMoney(Math.max(0, subtotal - couponDiscount - bankDiscount) + shipping);

  return {
    subtotal,
    couponDiscount,
    bankDiscount,
    shipping,
    tax: 0,
    total,
    lineItems,
    validatedCoupon,
    couponCode: validatedCoupon?.code || (couponCode === 'DISCOUNT10' ? 'DISCOUNT10' : null),
  };
};

const calculateOfferDiscount = (offer, itemSubtotal) => {
  if (!offer?.isActive) return 0;

  const now = new Date();
  if (offer.startDate && new Date(offer.startDate) > now) return 0;
  if (offer.endDate && new Date(offer.endDate) < now) return 0;
  if (offer.minTransactionAmount && itemSubtotal < offer.minTransactionAmount) return 0;

  if (offer.discountType === 'amount') {
    return calculateFixedDiscount(itemSubtotal, offer.discountValue);
  }
  return calculatePercentageDiscount(
    itemSubtotal,
    offer.discountValue,
    offer.maxDiscountAmount || Infinity
  );
};

export const validateCoupon = async (code, subtotal, userId) => {
  if (!code) return { valid: false, discountAmount: 0 };

  const normalizedCode = String(code).trim().toUpperCase();

  if (normalizedCode === 'DISCOUNT10') {
    return { valid: true, discountAmount: roundMoney(subtotal * 0.1), coupon: { code: 'DISCOUNT10' } };
  }

  const coupon = await Coupon.findOne({ code: normalizedCode, active: true });
  if (!coupon) return { valid: false, discountAmount: 0, reason: 'INVALID_COUPON' };

  const now = new Date();
  if (coupon.startDate && coupon.startDate > now) return { valid: false, discountAmount: 0, reason: 'NOT_STARTED' };
  if (coupon.endDate && coupon.endDate < now) return { valid: false, discountAmount: 0, reason: 'EXPIRED' };
  if (coupon.minimumTransactionAmount && subtotal < coupon.minimumTransactionAmount) {
    return { valid: false, discountAmount: 0, reason: 'MIN_AMOUNT_NOT_MET' };
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, discountAmount: 0, reason: 'USAGE_LIMIT_REACHED' };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'fixed') {
    discountAmount = calculateFixedDiscount(subtotal, coupon.discountValue);
  } else {
    discountAmount = calculatePercentageDiscount(
      subtotal,
      coupon.discountValue,
      coupon.maximumDiscount || Infinity
    );
  }

  return { valid: true, discountAmount, coupon };
};

export { getDiscountedPrice };
