import mongoose from 'mongoose';
import ProductEmiOffer from '../models/ProductEmiOffer.js';
import Product from '../models/Product.js';
import { getEligibleEMIPlans } from '../services/emiCalculationService.js';

// @desc    Get eligible EMI offers for a product (calculates EMI)
// @route   GET /api/products/:id/eligible-emis
// @access  Public
export const getEligibleProductEmiOffers = async (req, res) => {
  try {
    const amount = Number(req.query.amount);
    if (!amount) {
      return res.status(400).json({ message: 'Amount is required to calculate EMI' });
    }
    const plans = await getEligibleEMIPlans(amount, req.params.id);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching eligible EMI plans' });
  }
};

// @desc    Get EMI offers for a product
// @route   GET /api/products/:id/emi-offers
// @access  Public
export const getProductEmiOffers = async (req, res) => {
  try {
    const offers = await ProductEmiOffer.find({
      product: req.params.id,
      active: true
    }).sort({ priority: 1 });

    const now = new Date();
    // Filter out expired or not-yet-started offers
    const validOffers = offers.filter(offer => {
      if (offer.startDate && new Date(offer.startDate) > now) return false;
      if (offer.endDate && new Date(offer.endDate) < now) return false;
      return true;
    });

    res.json(validOffers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Product EMI offers' });
  }
};

// @desc    Create a Product EMI offer (Admin)
// @route   POST /api/products/:id/emi-offers
// @access  Private/Admin
export const createProductEmiOffer = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const offer = await ProductEmiOffer.create({
      product: req.params.id,
      ...req.body
    });

    // Add to product's emiOffers array
    product.emiOffers.push(offer._id);
    await product.save();

    res.status(201).json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error creating Product EMI offer' });
  }
};

// @desc    Update a Product EMI offer (Admin)
// @route   PUT /api/emi-offers/:id
// @access  Private/Admin
export const updateProductEmiOffer = async (req, res) => {
  try {
    const offer = await ProductEmiOffer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'EMI offer not found' });
    }

    Object.assign(offer, req.body);
    const updatedOffer = await offer.save();
    res.json(updatedOffer);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error updating EMI offer' });
  }
};

// @desc    Delete a Product EMI offer (Admin)
// @route   DELETE /api/emi-offers/:id
// @access  Private/Admin
export const deleteProductEmiOffer = async (req, res) => {
  try {
    const offer = await ProductEmiOffer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ message: 'EMI offer not found' });
    }

    // Remove from Product's array
    await Product.updateOne(
      { _id: offer.product },
      { $pull: { emiOffers: offer._id } }
    );

    await ProductEmiOffer.findByIdAndDelete(req.params.id);
    res.json({ message: 'EMI offer removed' });
  } catch (error) {
    console.error("Error deleting EMI offer:", error);
    res.status(500).json({ message: 'Error deleting EMI offer' });
  }
};

// @desc    Create/Update a batch of Product EMI offers for a specific bank (Admin)
// @route   POST /api/products/:id/emi-offers/batch
// @access  Private/Admin
export const createBatchProductEmiOffers = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { bankName, offers } = req.body;
    const productId = req.params.id;

    if (!bankName || !offers || !Array.isArray(offers)) {
      throw new Error('Invalid batch data');
    }

    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error('Product not found');
    }

    // Delete existing offers for this product and bank
    const deletedOffers = await ProductEmiOffer.find({ product: productId, bankName }).session(session);
    const deletedIds = deletedOffers.map(o => o._id);

    await ProductEmiOffer.deleteMany({ product: productId, bankName }).session(session);

    // Remove deleted IDs from product.emiOffers
    if (deletedIds.length > 0) {
      product.emiOffers = product.emiOffers.filter(id => !deletedIds.some(dId => dId.equals(id)));
    }

    // Insert new offers
    if (offers.length > 0) {
      const offersToCreate = offers.map(o => ({
        ...o,
        product: productId,
        bankName
      }));

      const createdOffers = await ProductEmiOffer.insertMany(offersToCreate, { session });
      const createdIds = createdOffers.map(o => o._id);

      product.emiOffers.push(...createdIds);
    }

    await product.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'Batch saved successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message || 'Error saving batch EMI offers' });
  }
};

// @desc    Delete all Product EMI offers for a specific bank (Admin)
// @route   DELETE /api/products/:id/emi-offers/bank/:bankName
// @access  Private/Admin
export const deleteProductEmiBankOffers = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const productId = req.params.id;
    const bankName = decodeURIComponent(req.params.bankName);

    const deletedOffers = await ProductEmiOffer.find({ product: productId, bankName }).session(session);
    const deletedIds = deletedOffers.map(o => o._id);

    if (deletedIds.length > 0) {
      await ProductEmiOffer.deleteMany({ product: productId, bankName }).session(session);

      await Product.updateOne(
        { _id: productId },
        { $pull: { emiOffers: { $in: deletedIds } } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Bank offers removed' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message || 'Error deleting bank offers' });
  }
};
