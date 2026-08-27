import EmiBank from '../models/EmiBank.js';
import ProductEmiOffer from '../models/ProductEmiOffer.js';
import EmiPlan from '../models/EmiPlan.js';
import EmiQuote from '../models/EmiQuote.js';
import Cart from '../models/Cart.js';

// @desc    Get all active EMI Banks
// @route   GET /api/emi
// @access  Public
export const getEmiBanks = async (req, res) => {
  try {
    const banks = await EmiBank.find({ active: true });
    res.json(banks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching EMI banks' });
  }
};

// @desc    Create an EMI Bank
// @route   POST /api/emi
// @access  Private/Admin
export const createEmiBank = async (req, res) => {
  try {
    const bank = new EmiBank(req.body);
    const createdBank = await bank.save();
    res.status(201).json(createdBank);
  } catch (error) {
    res.status(400).json({ message: 'Error creating EMI bank', error: error.message });
  }
};

// @desc    Update an EMI Bank
// @route   PUT /api/emi/:id
// @access  Private/Admin
export const updateEmiBank = async (req, res) => {
  try {
    const bank = await EmiBank.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (bank) {
      res.json(bank);
    } else {
      res.status(404).json({ message: 'EMI Bank not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating EMI bank', error: error.message });
  }
};

// @desc    Delete an EMI Bank
// @route   DELETE /api/emi/:id
// @access  Private/Admin
export const deleteEmiBank = async (req, res) => {
  try {
    const bank = await EmiBank.findById(req.params.id);
    if (bank) {
      await EmiBank.deleteOne({ _id: bank._id });
      res.json({ message: 'EMI Bank removed' });
    } else {
      res.status(404).json({ message: 'EMI Bank not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error deleting EMI bank', error: error.message });
  }
};

// @desc    Get eligible EMI Plans for a specific bank and order amount
// @route   POST /api/emi/plans
// @access  Private
export const getEligibleEmiPlans = async (req, res) => {
  try {
    const { bankId, orderAmount } = req.body;

    if (!bankId || !orderAmount) {
      return res.status(400).json({ message: 'Bank ID and order amount are required' });
    }

    const plans = await EmiPlan.find({
      bankId,
      isActive: true,
      $and: [
        { minimumOrderValue: { $lte: orderAmount } },
        { $or: [{ maximumOrderValue: null }, { maximumOrderValue: { $gte: orderAmount } }] }
      ]
    }).sort({ displayOrder: 1, tenureMonths: 1 });

    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching eligible EMI plans' });
  }
};

// @desc    Get eligible EMI Banks for a specific cart based on product offers
// @route   GET /api/emi/cart/:cartId/eligible-banks
// @access  Private
export const getCartEligibleEmiBanks = async (req, res) => {
  try {
    const cart = await Cart.findById(req.params.cartId);
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(404).json({ message: 'Cart not found or empty' });
    }

    const productIds = cart.items.map(item => item.product);

    // Fetch all active ProductEmiOffers for any product in the cart
    const offers = await ProductEmiOffer.find({
      product: { $in: productIds },
      active: true
    });

    const now = new Date();
    const validOffers = offers.filter(offer => {
      if (offer.startDate && new Date(offer.startDate) > now) return false;
      if (offer.endDate && new Date(offer.endDate) < now) return false;
      return true;
    });

    if (validOffers.length === 0) {
      return res.json([]); // No product specific offers
    }

    const banksMap = new Map();

    validOffers.forEach(offer => {
      if (!banksMap.has(offer.bankName)) {
        banksMap.set(offer.bankName, {
          _id: offer.bankName, // Using name as ID for frontend key
          bankName: offer.bankName,
          logo: offer.logo || '',
          hasNoCostEmi: offer.emiType === 'NO_COST'
        });
      } else {
        if (offer.emiType === 'NO_COST') {
          banksMap.get(offer.bankName).hasNoCostEmi = true;
        }
      }
    });

    res.json(Array.from(banksMap.values()));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching eligible banks for cart', error: error.message });
  }
};

// @desc    Get eligible EMI Plans for a specific cart and bank
// @route   POST /api/emi/cart/:cartId/eligible-plans
// @access  Private
export const getCartEligibleEmiPlans = async (req, res) => {
  try {
    const { bankName, orderAmount } = req.body;
    if (!bankName || !orderAmount) return res.status(400).json({ message: 'Missing parameters' });

    const cart = await Cart.findById(req.params.cartId);
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    const productIds = cart.items.map(item => item.product);

    const offers = await ProductEmiOffer.find({
      product: { $in: productIds },
      bankName,
      active: true,
      $and: [
        { minOrderAmount: { $lte: orderAmount } },
        { $or: [{ maxOrderAmount: null }, { maxOrderAmount: { $gte: orderAmount } }] }
      ]
    }).sort({ priority: 1, tenure: 1 });

    const now = new Date();
    const validOffers = offers.filter(offer => {
      if (offer.startDate && new Date(offer.startDate) > now) return false;
      if (offer.endDate && new Date(offer.endDate) < now) return false;
      return true;
    });

    // Map ProductEmiOffer to the standard EmiPlan structure the frontend expects
    const mappedPlans = validOffers.map(offer => ({
      _id: offer._id,
      bankId: offer.bankName, // Using string instead of ObjectId
      tenureMonths: offer.tenure,
      interestRate: offer.interestRate,
      processingFeeType: offer.processingFee > 0 ? 'amount' : 'none',
      processingFeeValue: offer.processingFee,
      isNoCostEmi: offer.emiType === 'NO_COST',
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      gstApplicable: true,
      isActive: true
    }));

    res.json(mappedPlans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching eligible plans for cart', error: error.message });
  }
};

// @desc    Generate a secure server-side EMI quote
// @route   POST /api/emi/quote
// @access  Private
export const generateEmiQuote = async (req, res) => {
  try {
    const { cartId, bankId, emiPlanId, orderAmount } = req.body;

    if (!cartId || !bankId || !emiPlanId || !orderAmount) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    let plan;
    let isProductOffer = false;

    // Determine if emiPlanId is a ProductEmiOffer or a generic EmiPlan
    try {
      plan = await EmiPlan.findById(emiPlanId);
    } catch (e) {
      // Invalid ObjectId for EmiPlan, maybe ProductEmiOffer
    }

    if (!plan) {
      plan = await ProductEmiOffer.findById(emiPlanId);
      if (plan) {
        isProductOffer = true;
        // Map fields to generic EmiPlan expectations
        plan.tenureMonths = plan.tenure;
        plan.processingFeeType = plan.processingFee > 0 ? 'amount' : 'none';
        plan.processingFeeValue = plan.processingFee;
        plan.gstApplicable = true;
        plan.isNoCostEmi = plan.emiType === 'NO_COST';
      }
    }

    if (!plan || (!isProductOffer && !plan.isActive) || (isProductOffer && !plan.active)) {
      return res.status(400).json({ message: 'Invalid or inactive EMI plan' });
    }

    const amount = Number(orderAmount);

    // Validate amount boundaries
    const minVal = isProductOffer ? plan.minOrderAmount : plan.minimumOrderValue;
    const maxVal = isProductOffer ? plan.maxOrderAmount : plan.maximumOrderValue;

    if (amount < minVal || (maxVal && amount > maxVal)) {
      return res.status(400).json({ message: 'Order amount not eligible for this plan' });
    }

    // Apply any explicit discounts configured in the plan/offer
    let appliedDiscount = 0;
    if (plan.discountType === 'amount') {
      appliedDiscount = plan.discountValue;
    } else if (plan.discountType === 'percentage') {
      appliedDiscount = (amount * plan.discountValue) / 100;
    }
    const principal = Math.max(0, amount - appliedDiscount);

    // Server-side EMI Calculation (Reducing Balance Method)
    let monthlyEmi = 0;
    let totalInterest = 0;

    if (plan.interestRate > 0) {
      const r = plan.interestRate / 12 / 100;
      const n = plan.tenureMonths;
      monthlyEmi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      totalInterest = (monthlyEmi * n) - principal;
    } else {
      monthlyEmi = principal / plan.tenureMonths;
      totalInterest = 0;
    }

    // No-Cost EMI effective interest nullification
    if (plan.isNoCostEmi) {
      totalInterest = 0;
      monthlyEmi = principal / plan.tenureMonths;
    }

    let processingFee = 0;
    if (plan.processingFeeType === 'amount') {
      processingFee = plan.processingFeeValue;
    } else if (plan.processingFeeType === 'percentage') {
      processingFee = (principal * plan.processingFeeValue) / 100;
    }

    let gst = 0;
    if (plan.gstApplicable) {
      gst = totalInterest * 0.18; // Typical 18% GST on interest in India
    }

    const totalPrincipal = principal;
    const payableNow = plan.isNoCostEmi ? principal : principal;

    // Expiry in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const quote = new EmiQuote({
      cartId,
      bankId,
      emiPlanId,
      orderAmount: amount,
      tenureMonths: plan.tenureMonths,
      interestRate: plan.interestRate,
      monthlyEmi: Number(monthlyEmi.toFixed(2)),
      totalPrincipal: Number(totalPrincipal.toFixed(2)),
      totalInterest: Number(totalInterest.toFixed(2)),
      processingFee: Number(processingFee.toFixed(2)),
      gst: Number(gst.toFixed(2)),
      payableNow: Number(payableNow.toFixed(2)),
      expiresAt
    });

    await quote.save();

    res.status(201).json(quote);
  } catch (error) {
    res.status(500).json({ message: 'Error generating EMI quote', error: error.message });
  }
};
