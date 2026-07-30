import Offer from '../models/Offer.js';

// @desc    Get all active offers (Public)
// @route   GET /api/offers
// @access  Public
export const getActiveOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all offers (Admin)
// @route   GET /api/offers/all
// @access  Private/Admin
export const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find({}).sort({ createdAt: -1 });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new offer
// @route   POST /api/offers
// @access  Private/Admin
export const createOffer = async (req, res) => {
  try {
    const { bankName, description, discountType, discountValue, cardType, isActive } = req.body;
    
    const offer = await Offer.create({
      bankName,
      description,
      discountType,
      discountValue,
      cardType,
      isActive
    });

    res.status(201).json(offer);
  } catch (error) {
    res.status(400).json({ message: 'Invalid offer data' });
  }
};

// @desc    Update an offer
// @route   PUT /api/offers/:id
// @access  Private/Admin
export const updateOffer = async (req, res) => {
  try {
    const { bankName, description, discountType, discountValue, cardType, isActive } = req.body;

    const offer = await Offer.findById(req.params.id);

    if (offer) {
      offer.bankName = bankName || offer.bankName;
      offer.description = description || offer.description;
      offer.discountType = discountType || offer.discountType;
      offer.discountValue = discountValue !== undefined ? discountValue : offer.discountValue;
      offer.cardType = cardType || offer.cardType;
      offer.isActive = isActive !== undefined ? isActive : offer.isActive;

      const updatedOffer = await offer.save();
      res.json(updatedOffer);
    } else {
      res.status(404).json({ message: 'Offer not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Invalid data' });
  }
};

// @desc    Delete an offer
// @route   DELETE /api/offers/:id
// @access  Private/Admin
export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (offer) {
      await offer.deleteOne();
      res.json({ message: 'Offer removed' });
    } else {
      res.status(404).json({ message: 'Offer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
