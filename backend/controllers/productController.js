import Product from '../models/Product.js';
import slugify from '../utils/slugify.js';

const buildProductQuery = (query) => {
  const filter = {};
  const {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    featured,
    bestSelling,
    sort,
  } = query;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (featured === 'true') filter.featured = true;
  if (bestSelling === 'true') filter.bestSelling = true;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (inStock === 'true') filter.stock = { $gt: 0 };

  let sortOption = { createdAt: -1 };
  switch (sort) {
    case 'price_asc':
      sortOption = { price: 1 };
      break;
    case 'price_desc':
      sortOption = { price: -1 };
      break;
    case 'rating':
      sortOption = { rating: -1 };
      break;
    case 'best_selling':
      sortOption = { salesCount: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  return { filter, sortOption };
};

export const getProducts = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const { filter, sortOption } = buildProductQuery(req.query);

  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('brand', 'name logo')
    .populate('category', 'name image')
    .populate('offers')
    .sort(sortOption)
    .limit(limit)
    .skip((page - 1) * limit);

  res.json({
    products,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
};

export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('brand', 'name logo')
    .populate('category', 'name image')
    .populate('offers')
    .populate('reviews.user', 'name');

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
};

export const getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('brand', 'name logo')
    .populate('category', 'name image')
    .populate('offers')
    .populate('reviews.user', 'name');

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
};

export const createProduct = async (req, res) => {
  const images = req.files?.map((file) => `/uploads/${file.filename}`) || [];

  const specifications = {};
  if (req.body.specifications) {
    const specs =
      typeof req.body.specifications === 'string'
        ? JSON.parse(req.body.specifications)
        : req.body.specifications;
    Object.assign(specifications, specs);
  }

  const features = req.body.features
    ? typeof req.body.features === 'string'
      ? JSON.parse(req.body.features)
      : req.body.features
    : [];

  const offers = req.body.offers
    ? typeof req.body.offers === 'string'
      ? JSON.parse(req.body.offers)
      : req.body.offers
    : [];

  const product = await Product.create({
    name: req.body.name,
    slug: slugify(req.body.name),
    brand: req.body.brand,
    category: req.body.category,
    price: Number(req.body.price),
    discount: Number(req.body.discount) || 0,
    stock: Number(req.body.stock),
    description: req.body.description,
    specifications,
    features,
    images,
    offers,
    featured: req.body.featured === 'true' || req.body.featured === true,
    bestSelling: req.body.bestSelling === 'true' || req.body.bestSelling === true,
  });

  const populated = await Product.findById(product._id)
    .populate('brand', 'name logo')
    .populate('category', 'name image')
    .populate('offers');

  res.status(201).json(populated);
};

export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const newImages = req.files?.map((file) => `/uploads/${file.filename}`) || [];
  const existingImages = req.body.existingImages
    ? typeof req.body.existingImages === 'string'
      ? JSON.parse(req.body.existingImages)
      : req.body.existingImages
    : product.images;

  if (req.body.name) {
    product.name = req.body.name;
    product.slug = slugify(req.body.name);
  }
  if (req.body.brand) product.brand = req.body.brand;
  if (req.body.category) product.category = req.body.category;
  if (req.body.price !== undefined) product.price = Number(req.body.price);
  if (req.body.discount !== undefined) product.discount = Number(req.body.discount);
  if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
  if (req.body.description) product.description = req.body.description;

  if (req.body.specifications) {
    const specs =
      typeof req.body.specifications === 'string'
        ? JSON.parse(req.body.specifications)
        : req.body.specifications;
    product.specifications = specs;
  }

  if (req.body.features) {
    product.features =
      typeof req.body.features === 'string'
        ? JSON.parse(req.body.features)
        : req.body.features;
  }

  if (req.body.offers) {
    product.offers =
      typeof req.body.offers === 'string'
        ? JSON.parse(req.body.offers)
        : req.body.offers;
  }

  if (req.body.featured !== undefined) {
    product.featured = req.body.featured === 'true' || req.body.featured === true;
  }
  if (req.body.bestSelling !== undefined) {
    product.bestSelling = req.body.bestSelling === 'true' || req.body.bestSelling === true;
  }

  product.images = [...existingImages, ...newImages];

  const updated = await product.save();
  const populated = await Product.findById(updated._id)
    .populate('brand', 'name logo')
    .populate('category', 'name image')
    .populate('offers');

  res.json(populated);
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  await product.deleteOne();
  res.json({ message: 'Product removed' });
};

export const createReview = async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    return res.status(400).json({ message: 'Product already reviewed' });
  }

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  product.reviews.push(review);
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

  await product.save();
  res.status(201).json({ message: 'Review added' });
};

export const getRelatedProducts = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  })
    .populate('brand', 'name logo')
    .populate('category', 'name image')
    .limit(8);

  res.json(related);
};
