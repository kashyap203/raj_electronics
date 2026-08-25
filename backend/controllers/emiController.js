import EmiBank from '../models/EmiBank.js';

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
