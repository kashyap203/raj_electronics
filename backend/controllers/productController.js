import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import ProductSerialNumber from '../models/ProductSerialNumber.js';
import ProductBankDiscount from '../models/ProductBankDiscount.js';
import OfferEligibility from '../models/OfferEligibility.js';
import slugify from '../utils/slugify.js';

const buildProductQuery = async (query) => {
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
    ids
  } = query;

  if (ids) {
    const idArray = ids.split(',').filter(id => /^[0-9a-fA-F]{24}$/.test(id.trim())).map(id => id.trim());
    if (idArray.length > 0) {
      filter._id = { $in: idArray };
    }
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    const isObjectId = typeof category === 'string' && /^[0-9a-fA-F]{24}$/.test(category);
    if (isObjectId) {
      filter.category = category;
    } else {
      const catDoc = await Category.findOne({
        name: { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (catDoc) {
        filter.category = catDoc._id;
      } else {
        filter.category = null;
      }
    }
  }

  if (brand) {
    const isObjectId = typeof brand === 'string' && /^[0-9a-fA-F]{24}$/.test(brand);
    if (isObjectId) {
      filter.brand = brand;
    } else {
      const brandDoc = await Brand.findOne({
        name: { $regex: new RegExp(`^${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (brandDoc) {
        filter.brand = brandDoc._id;
      } else {
        filter.brand = null;
      }
    }
  }

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

// --- Per-Product Bank Discount Management ---

export const getBankDiscounts = async (req, res) => {
  const bankDiscounts = await ProductBankDiscount.find({ product: req.params.id }).populate('bank').sort({ createdAt: -1 });
  res.json(bankDiscounts);
};

export const addBankDiscount = async (req, res) => {
  const { bank, cardType, description, discountType, discountValue, maxDiscountAmount, minTransactionAmount, startDate, endDate, isActive } = req.body;
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Check for duplicate bank name for the same product
  const existing = await ProductBankDiscount.findOne({ product: req.params.id, bank });
  if (existing) {
    return res.status(400).json({ message: 'Discount for this bank already exists for this product.' });
  }

  const bankDiscount = await ProductBankDiscount.create({
    product: req.params.id,
    bank,
    cardType,
    description,
    discountType,
    discountValue: Number(discountValue),
    maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
    minTransactionAmount: minTransactionAmount ? Number(minTransactionAmount) : undefined,
    startDate,
    endDate,
    isActive: isActive === undefined ? true : isActive,
  });

  res.status(201).json(bankDiscount);
};

export const updateBankDiscount = async (req, res) => {
  const { bank, cardType, description, discountType, discountValue, maxDiscountAmount, minTransactionAmount, startDate, endDate, isActive } = req.body;
  const bankDiscount = await ProductBankDiscount.findById(req.params.discountId);
  
  if (!bankDiscount) {
    return res.status(404).json({ message: 'Bank discount not found' });
  }

  if (bank && bank !== bankDiscount.bank?.toString()) {
    const existing = await ProductBankDiscount.findOne({ product: bankDiscount.product, bank });
    if (existing) {
      return res.status(400).json({ message: 'Discount for this bank already exists for this product.' });
    }
    bankDiscount.bank = bank;
  }

  if (cardType !== undefined) bankDiscount.cardType = cardType;
  if (description !== undefined) bankDiscount.description = description;
  if (discountType) bankDiscount.discountType = discountType;
  if (discountValue !== undefined) bankDiscount.discountValue = Number(discountValue);
  if (maxDiscountAmount !== undefined) bankDiscount.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : undefined;
  if (minTransactionAmount !== undefined) bankDiscount.minTransactionAmount = minTransactionAmount ? Number(minTransactionAmount) : undefined;
  if (startDate !== undefined) bankDiscount.startDate = startDate;
  if (endDate !== undefined) bankDiscount.endDate = endDate;
  if (isActive !== undefined) bankDiscount.isActive = Boolean(isActive);

  await bankDiscount.save();
  res.json(bankDiscount);
};

export const deleteBankDiscount = async (req, res) => {
  const bankDiscount = await ProductBankDiscount.findById(req.params.discountId);
  if (!bankDiscount) {
    return res.status(404).json({ message: 'Bank discount not found' });
  }

  await bankDiscount.deleteOne();
  res.json({ message: 'Bank discount removed' });
};

export const getProducts = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const { filter, sortOption } = await buildProductQuery(req.query);

  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate('brand', 'name logo')
    .populate('category', 'name image')
    .populate('offers')
    .sort(sortOption)
    .limit(limit)
    .skip((page - 1) * limit);

  // Attach bank discounts for the fetched products
  const productIds = products.map(p => p._id);
  const allBankDiscounts = await ProductBankDiscount.find({ product: { $in: productIds } }).populate('bank');

  const productsWithDiscounts = products.map(p => {
    const pObj = p.toObject();
    pObj.bankDiscounts = allBankDiscounts.filter(d => d.product.toString() === p._id.toString());
    return pObj;
  });

  res.json({
    products: productsWithDiscounts,
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

  // Attach all bank discounts (admin might need inactive ones)
  const bankDiscounts = await ProductBankDiscount.find({ product: product._id }).populate('bank');
  
  const productObj = product.toObject();
  productObj.bankDiscounts = bankDiscounts;

  res.json(productObj);
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

  // Attach active bank discounts
  const bankDiscounts = await ProductBankDiscount.find({ product: product._id, isActive: true }).populate('bank');
  
  const productObj = product.toObject();
  productObj.bankDiscounts = bankDiscounts;

  res.json(productObj);
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
    emiConfig: req.body.emiConfig ? (typeof req.body.emiConfig === 'string' ? JSON.parse(req.body.emiConfig) : req.body.emiConfig) : undefined,
  });

  if (req.body.bankDiscounts) {
    const bankDiscounts = typeof req.body.bankDiscounts === 'string'
      ? JSON.parse(req.body.bankDiscounts)
      : req.body.bankDiscounts;
    for (const d of bankDiscounts) {
      await ProductBankDiscount.create({
        product: product._id,
        bank: d.bank,
        cardType: d.cardType,
        description: d.description,
        discountType: d.discountType,
        discountValue: Number(d.discountValue),
        maxDiscountAmount: d.maxDiscountAmount ? Number(d.maxDiscountAmount) : undefined,
        minTransactionAmount: d.minTransactionAmount ? Number(d.minTransactionAmount) : undefined,
        startDate: d.startDate,
        endDate: d.endDate,
        isActive: Boolean(d.isActive),
      });
    }
  }

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

  if (req.body.emiConfig) {
    product.emiConfig = typeof req.body.emiConfig === 'string'
      ? JSON.parse(req.body.emiConfig)
      : req.body.emiConfig;
  }

  product.images = [...existingImages, ...newImages];

  const updated = await product.save();

  if (req.body.bankDiscounts) {
    const bankDiscounts = typeof req.body.bankDiscounts === 'string'
      ? JSON.parse(req.body.bankDiscounts)
      : req.body.bankDiscounts;
    
    const existingDiscounts = await ProductBankDiscount.find({ product: updated._id });
    const existingIds = existingDiscounts.map(d => d._id.toString());
    const incomingIds = bankDiscounts.map(d => d._id).filter(Boolean);

    const toDelete = existingIds.filter(id => !incomingIds.includes(id));
    await ProductBankDiscount.deleteMany({ _id: { $in: toDelete } });

    for (const d of bankDiscounts) {
      if (d._id && existingIds.includes(d._id)) {
        await ProductBankDiscount.findByIdAndUpdate(d._id, {
          bank: d.bank,
          cardType: d.cardType,
          description: d.description,
          discountType: d.discountType,
          discountValue: Number(d.discountValue),
          maxDiscountAmount: d.maxDiscountAmount ? Number(d.maxDiscountAmount) : undefined,
          minTransactionAmount: d.minTransactionAmount ? Number(d.minTransactionAmount) : undefined,
          startDate: d.startDate,
          endDate: d.endDate,
          isActive: Boolean(d.isActive),
        });
      } else {
        await ProductBankDiscount.create({
          product: updated._id,
          bank: d.bank,
          cardType: d.cardType,
          description: d.description,
          discountType: d.discountType,
          discountValue: Number(d.discountValue),
          maxDiscountAmount: d.maxDiscountAmount ? Number(d.maxDiscountAmount) : undefined,
          minTransactionAmount: d.minTransactionAmount ? Number(d.minTransactionAmount) : undefined,
          startDate: d.startDate,
          endDate: d.endDate,
          isActive: Boolean(d.isActive),
        });
      }
    }
  }

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

// --- Serial Number Management ---

export const getSerialNumbers = async (req, res) => {
  const serialNumbers = await ProductSerialNumber.find({ product: req.params.id }).sort({ createdAt: -1 });
  res.json(serialNumbers);
};

export const addSerialNumber = async (req, res) => {
  const { serialNumber, discount } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const existing = await ProductSerialNumber.findOne({ serialNumber });
  if (existing) {
    return res.status(400).json({ message: 'Serial number already exists' });
  }

  const sn = await ProductSerialNumber.create({
    product: req.params.id,
    serialNumber,
    discount: Number(discount) || 0,
    status: 'Available',
  });

  // Update product stock based on available serial numbers
  const availableCount = await ProductSerialNumber.countDocuments({ product: req.params.id, status: 'Available' });
  product.stock = availableCount;
  await product.save();

  res.status(201).json(sn);
};

export const deleteSerialNumber = async (req, res) => {
  const sn = await ProductSerialNumber.findById(req.params.snId);
  if (!sn) {
    return res.status(404).json({ message: 'Serial number not found' });
  }

  if (sn.status === 'Sold') {
    return res.status(400).json({ message: 'Cannot delete a sold serial number' });
  }

  const productId = sn.product;
  await sn.deleteOne();
  
  // Cleanup offer eligibility mappings
  await OfferEligibility.deleteMany({ serialNumber: sn._id });

  // Update stock
  const availableCount = await ProductSerialNumber.countDocuments({ product: productId, status: 'Available' });
  const product = await Product.findById(productId);
  if (product) {
    product.stock = availableCount;
    await product.save();
  }

  res.json({ message: 'Serial number removed' });
};

export const updateSerialNumber = async (req, res) => {
  const { serialNumber, discount } = req.body;
  const sn = await ProductSerialNumber.findById(req.params.snId);
  if (!sn) {
    return res.status(404).json({ message: 'Serial number not found' });
  }

  // If changing the serial number string, check for uniqueness
  if (serialNumber && serialNumber !== sn.serialNumber) {
    const existing = await ProductSerialNumber.findOne({ serialNumber });
    if (existing) {
      return res.status(400).json({ message: 'Serial number already exists' });
    }
    sn.serialNumber = serialNumber;
  }

  if (discount !== undefined) {
    sn.discount = Number(discount) || 0;
  }

  await sn.save();
  res.json(sn);
};


