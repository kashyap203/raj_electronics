import Wishlist from '../models/Wishlist.js';

export const getWishlist = async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'products',
    populate: [
      { path: 'brand', select: 'name logo' },
      { path: 'category', select: 'name' },
    ],
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  res.json(wishlist);
};

export const addToWishlist = async (req, res) => {
  const { productId } = req.body;

  let wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  }

  if (!wishlist.products.includes(productId)) {
    wishlist.products.push(productId);
    await wishlist.save();
  }

  const populated = await Wishlist.findById(wishlist._id).populate({
    path: 'products',
    populate: [
      { path: 'brand', select: 'name logo' },
      { path: 'category', select: 'name' },
    ],
  });

  res.json(populated);
};

export const removeFromWishlist = async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    return res.status(404).json({ message: 'Wishlist not found' });
  }

  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== req.params.productId
  );

  await wishlist.save();

  const populated = await Wishlist.findById(wishlist._id).populate({
    path: 'products',
    populate: [
      { path: 'brand', select: 'name logo' },
      { path: 'category', select: 'name' },
    ],
  });

  res.json(populated);
};
