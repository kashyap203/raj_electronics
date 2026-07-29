import DeliveryCity from '../models/DeliveryCity.js';

// @desc    Get all delivery cities
// @route   GET /api/delivery-cities
// @access  Public
export const getDeliveryCities = async (req, res) => {
  try {
    const cities = await DeliveryCity.find({}).sort({ cityName: 1 });
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a delivery city
// @route   POST /api/delivery-cities
// @access  Private/Admin
export const addDeliveryCity = async (req, res) => {
  try {
    const { cityName } = req.body;

    if (!cityName) {
      return res.status(400).json({ message: 'City name is required' });
    }

    const cityExists = await DeliveryCity.findOne({ 
      cityName: { $regex: new RegExp(`^${cityName}$`, 'i') } 
    });

    if (cityExists) {
      return res.status(400).json({ message: 'City already exists in free delivery list' });
    }

    const city = await DeliveryCity.create({ cityName });
    res.status(201).json(city);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a delivery city
// @route   DELETE /api/delivery-cities/:id
// @access  Private/Admin
export const deleteDeliveryCity = async (req, res) => {
  try {
    const city = await DeliveryCity.findById(req.params.id);

    if (city) {
      await city.deleteOne();
      res.json({ message: 'City removed from free delivery list' });
    } else {
      res.status(404).json({ message: 'City not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
