import Offer from '../models/Offer.js';
import ProductBankDiscount from '../models/ProductBankDiscount.js';
import Product from '../models/Product.js';
import { roundMoney, calculatePercentageDiscount, calculateFixedDiscount } from '../utils/moneyUtils.js';

const SUPPORTED_BANKS = ['HDFC', 'SBI', 'ICICI'];

const normalizeBankName = (name) => {
  if (!name) return '';
  const upper = String(name).toUpperCase();
  if (upper.includes('HDFC')) return 'HDFC';
  if (upper.includes('SBI') || upper.includes('STATE BANK')) return 'SBI';
  if (upper.includes('ICICI')) return 'ICICI';
  return upper;
};

const isOfferActive = (offer) => {
  if (!offer || offer.isActive === false) return false;
  const now = new Date();
  if (offer.startDate && new Date(offer.startDate) > now) return false;
  if (offer.endDate && new Date(offer.endDate) < now) return false;
  return true;
};

/**
 * Get eligible bank offers for a cart/checkout context.
 */
export const getEligibleBankOffers = async ({
  cartItems = [],
  orderAmount = 0,
  bank = null,
  paymentMethod = null,
}) => {
  const eligibleOffers = [];
  const productIds = cartItems.map((i) => String(i.product?._id || i.product)).filter(Boolean);

  const globalOffers = await Offer.find({ isActive: true });
  const productDiscounts = await ProductBankDiscount.find({
    product: { $in: productIds },
    isActive: true,
  }).populate('bank');

  for (const offer of globalOffers) {
    if (!isOfferActive(offer)) continue;

    const offerBank = normalizeBankName(offer.bankName);
    if (bank && offerBank !== normalizeBankName(bank)) continue;
    if (!SUPPORTED_BANKS.includes(offerBank)) continue;

    if (offer.minTransactionAmount && orderAmount < offer.minTransactionAmount) continue;
    if (offer.maxDiscountAmount && orderAmount > (offer.maximumTransactionAmount || Infinity)) {
      // no max transaction on Offer model — skip
    }

    eligibleOffers.push({
      type: 'global',
      bank: offerBank,
      offerId: offer._id,
      offerName: offer.bankName,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      maxDiscount: offer.maxDiscountAmount,
      minAmount: offer.minTransactionAmount,
      cardType: offer.cardType,
      paymentMethod,
    });
  }

  for (const discount of productDiscounts) {
    if (!isOfferActive(discount)) continue;

    const offerBank = normalizeBankName(discount.bank?.bankName);
    if (bank && offerBank !== normalizeBankName(bank)) continue;
    if (!SUPPORTED_BANKS.includes(offerBank)) continue;

    const cartItem = cartItems.find(
      (i) => String(i.product?._id || i.product) === String(discount.product)
    );
    if (!cartItem) continue;

    const product = cartItem.product?._id ? cartItem.product : await Product.findById(discount.product);
    if (!product) continue;

    const unitPrice = roundMoney(product.price - (product.price * (product.discount || 0)) / 100);
    const itemSubtotal = roundMoney(unitPrice * (cartItem.quantity || 1));

    if (discount.minTransactionAmount && itemSubtotal < discount.minTransactionAmount) continue;

    eligibleOffers.push({
      type: 'product',
      bank: offerBank,
      offerId: discount._id,
      productId: discount.product,
      offerName: `${offerBank} - ${product.name}`,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      maxDiscount: discount.maxDiscountAmount,
      minAmount: discount.minTransactionAmount,
      cardType: discount.cardType,
      paymentMethod,
      itemSubtotal,
    });
  }

  return eligibleOffers;
};

/**
 * Calculate total bank discount for cart items with applied offers.
 */
export const calculateBankDiscount = async ({ cartItems = [], isOnlinePayment = true }) => {
  if (!isOnlinePayment) return { bankDiscount: 0, breakdown: [] };

  let totalDiscount = 0;
  const breakdown = [];

  for (const item of cartItems) {
    const product = item.product;
    if (!product) continue;

    const unitPrice = roundMoney(product.price - (product.price * (product.discount || 0)) / 100);
    const itemSubtotal = roundMoney(unitPrice * item.quantity);
    let itemDiscount = 0;
    let source = null;

    if (item.appliedOffer && isOfferActive(item.appliedOffer)) {
      const offer = item.appliedOffer;
      if (!offer.minTransactionAmount || itemSubtotal >= offer.minTransactionAmount) {
        if (offer.discountType === 'amount') {
          itemDiscount = calculateFixedDiscount(itemSubtotal, offer.discountValue);
        } else {
          itemDiscount = calculatePercentageDiscount(
            itemSubtotal,
            offer.discountValue,
            offer.maxDiscountAmount || Infinity
          );
        }
        source = { type: 'global', offerId: offer._id, bank: normalizeBankName(offer.bankName) };
      }
    } else if (item.appliedBankDiscount && isOfferActive(item.appliedBankDiscount)) {
      const bd = item.appliedBankDiscount;
      const bankName = bd.bank?.bankName ? normalizeBankName(bd.bank.bankName) : null;

      if (!bd.minTransactionAmount || itemSubtotal >= bd.minTransactionAmount) {
        if (bd.discountType === 'amount') {
          itemDiscount = calculateFixedDiscount(itemSubtotal, bd.discountValue);
        } else {
          itemDiscount = calculatePercentageDiscount(
            itemSubtotal,
            bd.discountValue,
            bd.maxDiscountAmount || Infinity
          );
        }
        source = { type: 'product', offerId: bd._id, bank: bankName };
      }
    }

    totalDiscount += itemDiscount;
    if (itemDiscount > 0) {
      breakdown.push({ productId: product._id, itemSubtotal, itemDiscount, source });
    }
  }

  return { bankDiscount: roundMoney(totalDiscount), breakdown };
};

export { SUPPORTED_BANKS, normalizeBankName };
