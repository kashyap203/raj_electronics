import Slider from '../models/Slider.js';
import fs from 'fs';
import path from 'path';

// @desc    Get all active sliders (for frontend)
// @route   GET /api/sliders
// @access  Public
const getSliders = async (req, res, next) => {
  try {
    const sliders = await Slider.find({ isActive: true }).sort({ order: 1 });
    res.json(sliders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all sliders (for admin)
// @route   GET /api/sliders/admin
// @access  Private/Admin
const getAdminSliders = async (req, res, next) => {
  try {
    const sliders = await Slider.find({}).sort({ order: 1 });
    res.json(sliders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get slider by ID
// @route   GET /api/sliders/:id
// @access  Private/Admin
const getSliderById = async (req, res, next) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (slider) {
      res.json(slider);
    } else {
      res.status(404);
      throw new Error('Slider not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a slider
// @route   POST /api/sliders
// @access  Private/Admin
const createSlider = async (req, res, next) => {
  try {
    const {
      title,
      highlight,
      description,
      tag,
      tagIcon,
      badgeColor,
      primaryBtnText,
      primaryBtnLink,
      secondaryBtnText,
      secondaryBtnLink,
      isActive,
      order,
    } = req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    const slider = new Slider({
      title,
      highlight,
      description,
      tag,
      tagIcon,
      badgeColor,
      primaryBtnText,
      primaryBtnLink,
      secondaryBtnText,
      secondaryBtnLink,
      image,
      isActive,
      order: order || 0,
    });

    const createdSlider = await slider.save();
    res.status(201).json(createdSlider);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a slider
// @route   PUT /api/sliders/:id
// @access  Private/Admin
const updateSlider = async (req, res, next) => {
  try {
    const slider = await Slider.findById(req.params.id);

    if (slider) {
      slider.title = req.body.title || slider.title;
      slider.highlight = req.body.highlight !== undefined ? req.body.highlight : slider.highlight;
      slider.description = req.body.description !== undefined ? req.body.description : slider.description;
      slider.tag = req.body.tag !== undefined ? req.body.tag : slider.tag;
      slider.tagIcon = req.body.tagIcon || slider.tagIcon;
      slider.badgeColor = req.body.badgeColor || slider.badgeColor;
      slider.primaryBtnText = req.body.primaryBtnText !== undefined ? req.body.primaryBtnText : slider.primaryBtnText;
      slider.primaryBtnLink = req.body.primaryBtnLink !== undefined ? req.body.primaryBtnLink : slider.primaryBtnLink;
      slider.secondaryBtnText = req.body.secondaryBtnText !== undefined ? req.body.secondaryBtnText : slider.secondaryBtnText;
      if (req.file) {
        slider.image = `/uploads/${req.file.filename}`;
      } else if (req.body.image) {
        slider.image = req.body.image;
      }
      
      slider.isActive = req.body.isActive !== undefined ? req.body.isActive : slider.isActive;
      slider.order = req.body.order !== undefined ? req.body.order : slider.order;

      const updatedSlider = await slider.save();
      res.json(updatedSlider);
    } else {
      res.status(404);
      throw new Error('Slider not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a slider
// @route   DELETE /api/sliders/:id
// @access  Private/Admin
const deleteSlider = async (req, res, next) => {
  try {
    const slider = await Slider.findById(req.params.id);

    if (slider) {
      await slider.deleteOne();
      res.json({ message: 'Slider removed' });
    } else {
      res.status(404);
      throw new Error('Slider not found');
    }
  } catch (error) {
    next(error);
  }
};

export {
  getSliders,
  getAdminSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
};
