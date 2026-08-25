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
