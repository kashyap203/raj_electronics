import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
};

export const getCategoryById = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.json(category);
};

export const createCategory = async (req, res) => {
  const image = req.file ? `/uploads/${req.file.filename}` : req.body.image || '';
  const category = await Category.create({
    name: req.body.name,
    image,
    description: req.body.description || '',
  });
  res.status(201).json(category);
};

export const updateCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  category.name = req.body.name || category.name;
  category.description = req.body.description ?? category.description;
  if (req.file) {
    category.image = `/uploads/${req.file.filename}`;
  } else if (req.body.image !== undefined) {
    category.image = req.body.image;
  }

  const updated = await category.save();
  res.json(updated);
};

export const deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  await category.deleteOne();
  res.json({ message: 'Category removed' });
};
