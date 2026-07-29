import Brand from '../models/Brand.js';

export const getBrands = async (req, res) => {
  const brands = await Brand.find().sort({ name: 1 });
  res.json(brands);
};

export const getBrandById = async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({ message: 'Brand not found' });
  }
  res.json(brand);
};

export const createBrand = async (req, res) => {
  const logo = req.file ? `/uploads/${req.file.filename}` : req.body.logo || '';
  const brand = await Brand.create({
    name: req.body.name,
    logo,
  });
  res.status(201).json(brand);
};

export const updateBrand = async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({ message: 'Brand not found' });
  }

  brand.name = req.body.name || brand.name;
  if (req.file) {
    brand.logo = `/uploads/${req.file.filename}`;
  } else if (req.body.logo !== undefined) {
    brand.logo = req.body.logo;
  }

  const updated = await brand.save();
  res.json(updated);
};

export const deleteBrand = async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({ message: 'Brand not found' });
  }
  await brand.deleteOne();
  res.json({ message: 'Brand removed' });
};
