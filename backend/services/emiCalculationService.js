import ProductEmiOffer from '../models/ProductEmiOffer.js';
import EmiBank from '../models/EmiBank.js';

/**
 * Standard reducing balance EMI formula
 * P × r × (1+r)^n / ((1+r)^n - 1)
 */
export const calculateEMI = ({ principal, interestRate, tenureMonths, processingFee, discountValue = 0, discountType = 'none', emiType = 'REGULAR' }) => {
  let p = principal;
  
  // Apply discount if it's explicitly configured (like 10% off for using EMI)
  let appliedDiscount = 0;
  if (discountType === 'amount') {
    appliedDiscount = discountValue;
  } else if (discountType === 'percentage') {
    appliedDiscount = (p * discountValue) / 100;
  }
  
  p = Math.max(0, p - appliedDiscount);

  let r = interestRate / (12 * 100);
  let n = tenureMonths;
  
  let monthlyEMI = 0;
  let totalInterest = 0;

  if (interestRate === 0) {
    monthlyEMI = p / n;
  } else {
    monthlyEMI = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    totalInterest = (monthlyEMI * n) - p;
  }

  // Handle No-Cost EMI logic if interest is technically non-zero but customer interest is 0
  if (emiType === 'NO_COST') {
    // In many implementations of No Cost EMI, the merchant gives an upfront discount equal to the total interest
    // so the customer effectively pays the original principal.
    // For simplicity, we just set total interest to 0 and EMI to P/n from the customer's perspective.
    monthlyEMI = p / n;
    totalInterest = 0;
  }

  const finalPayable = (monthlyEMI * n) + processingFee;

  return {
    principal: p,
    monthlyEMI: Math.round(monthlyEMI * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    processingFee,
    totalDiscount: Math.round(appliedDiscount * 100) / 100,
    finalPayable: Math.round(finalPayable * 100) / 100
  };
};

import Product from '../models/Product.js';

/**
 * Fetch all eligible EMI plans for a specific cart/product amount
 */
export const getEligibleEMIPlans = async (cartAmount, productId = null) => {
  let productOffers = [];
  let baseEmiPlans = [];
  
  if (productId) {
    productOffers = await ProductEmiOffer.find({ product: productId, active: true });
    const product = await Product.findById(productId);
    
    // Generate Base EMI Plans if EMI is enabled
    if (product && product.emiConfig && product.emiConfig.enableEmi) {
      if (cartAmount >= (product.emiConfig.minEmiAmount || 3000)) {
        baseEmiPlans = (product.emiConfig.availableTenures || []).map(tenure => {
          return {
            isBaseEmi: true,
            bankName: 'Standard EMI',
            cardType: 'CREDIT',
            emiType: 'REGULAR',
            tenure,
            interestRate: product.emiConfig.baseInterestRate || 15,
            processingFee: product.emiConfig.processingFee || 0,
            discountValue: 0,
            discountType: 'none',
          };
        });
      }
    }
  }

  const now = new Date();
  
  // Filter product offers by amount and dates
  const eligibleOffers = productOffers.filter(offer => {
    if (cartAmount < offer.minOrderAmount) return false;
    if (offer.maxOrderAmount && cartAmount > offer.maxOrderAmount) return false;
    if (offer.startDate && new Date(offer.startDate) > now) return false;
    if (offer.endDate && new Date(offer.endDate) < now) return false;
    return true;
  });

  const offerPlans = eligibleOffers.map(offer => {
    const calc = calculateEMI({
      principal: cartAmount,
      interestRate: offer.interestRate,
      tenureMonths: offer.tenure,
      processingFee: offer.processingFee,
      discountValue: offer.discountValue,
      discountType: offer.discountType,
      emiType: offer.emiType
    });

    return {
      _id: offer._id,
      bankName: offer.bankName,
      logo: offer.logo,
      cardType: offer.cardType,
      emiType: offer.emiType,
      tenure: offer.tenure,
      ...calc
    };
  });

  const calculatedBasePlans = baseEmiPlans.map(plan => {
    const calc = calculateEMI({
      principal: cartAmount,
      interestRate: plan.interestRate,
      tenureMonths: plan.tenure,
      processingFee: plan.processingFee,
      discountValue: 0,
      discountType: 'none',
      emiType: 'REGULAR'
    });

    return {
      _id: `base-${plan.tenure}`,
      isBaseEmi: true,
      bankName: plan.bankName,
      logo: '',
      cardType: plan.cardType,
      emiType: plan.emiType,
      tenure: plan.tenure,
      ...calc
    };
  });

  // Combine and sort by lowest final payable
  const allPlans = [...offerPlans, ...calculatedBasePlans];
  allPlans.sort((a, b) => a.finalPayable - b.finalPayable || a.monthlyEMI - b.monthlyEMI);
  
  return allPlans;
};
