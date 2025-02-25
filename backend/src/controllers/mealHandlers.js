import Meal from '../models/meal_model';
import User from '../models/user_model';

// Create new meal
const createMeal = async (req, res) => {
  try {
    const newMeal = new Meal(req.body);
    await newMeal.save();
    res.status(201).json(newMeal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all meals
const getAllMeals = async (req, res) => {
  try {
    const meals = await Meal.find().populate('host participants.userID', 'firstName lastName');
    res.status(200).json(meals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// fetch meal by ID
const getMealById = async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.mealID).populate('host participants.userID', 'firstName lastName');
    if (!meal) return res.status(404).json({ error: 'Meal not found' });
    res.status(200).json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update meal
const updateMeal = async (req, res) => {
  try {
    const updatedMeal = await Meal.findByIdAndUpdate(
      req.params.mealID,
      req.body,
      { new: true }
    );
    if (!updatedMeal) return res.status(404).json({ error: 'Meal not found' });
    res.status(200).json(updatedMeal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete meal
const deleteMeal = async (req, res) => {
  try {
    await Meal.findByIdAndDelete(req.params.mealID);
    res.status(200).json({ message: 'Meal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  createMeal,
  getAllMeals,
  getMealById,
  updateMeal,
  deleteMeal,
};
