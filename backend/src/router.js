import { Router } from 'express';
import UserHandlers from './controllers/user_controller';
import SquadHandlers from './controllers/squad_controller';
import MealHandlers from './controllers/meal_controller';

const router = Router();

router.get('/', async (req, res) => {
  return res.send('Authorized. Welcome to the StealAMeal API.');
});

router.route('/users').get(UserHandlers.handleGetUsers);

router
  .route('/auth')
  .get(UserHandlers.handleGetOwnedUser)
  .post(UserHandlers.handleCreateUser);

router
  .route('/users/:userID')
  .get(UserHandlers.handleGetUserId)
  .patch(UserHandlers.handleUpdate)
  .delete(UserHandlers.handleDelete);

router
  .route('/squads')
  .post(SquadHandlers.createSquad)
  .get(SquadHandlers.getAllSquads);

router
  .route('/squads/:squadID')
  .get(SquadHandlers.getSquadById)
  .delete(SquadHandlers.deleteSquad);

router.route('/squads/:squadID/members').post(SquadHandlers.addMemberToSquad);

router
  .route('/squads/:squadID/members/:userID')
  .delete(SquadHandlers.removeMemberFromSquad);

router
  .route('/meals')
  .post(MealHandlers.createMeal)
  .get(MealHandlers.getAllMeals);

router
  .route('/meals/:mealID')
  .get(MealHandlers.getMealById)
  .patch(MealHandlers.updateMeal)
  .delete(MealHandlers.deleteMeal);

export default router;
