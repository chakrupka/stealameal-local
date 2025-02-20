import { Router } from 'express';
import UserHandlers from '../controllers/userHandlers';
import SquadHandlers from '../controllers/squadHandlers';
import MealHandlers from '../controllers/mealHandlers';
import { requireAuth, requireSignin } from '../services/authService';

const router = Router();

router.route('/users')
  .post(UserHandlers.handleCreateUser)
  .get(UserHandlers.handleGetUsers);

router.route('/users/:userID')
  .get(requireAuth, UserHandlers.handleGetUserId)
  .patch(requireAuth, UserHandlers.handleUpdate)
  .delete(requireAuth, UserHandlers.handleDelete);

router.route('/squads')
  .post(requireAuth, SquadHandlers.createSquad)
  .get(requireAuth, SquadHandlers.getAllSquads);

router.route('/squads/:squadID')
  .get(requireAuth, SquadHandlers.getSquadById)
  .delete(requireAuth, SquadHandlers.deleteSquad);

router.route('/squads/:squadID/members')
  .post(requireAuth, SquadHandlers.addMemberToSquad);

router.route('/squads/:squadID/members/:userID')
  .delete(requireAuth, SquadHandlers.removeMemberFromSquad);

router.route('/meals')
  .post(requireAuth, MealHandlers.createMeal)
  .get(requireAuth, MealHandlers.getAllMeals);

router.route('/meals/:mealID')
  .get(requireAuth, MealHandlers.getMealById)
  .patch(requireAuth, MealHandlers.updateMeal)
  .delete(requireAuth, MealHandlers.deleteMeal);

export default router;
