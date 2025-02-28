import { Router } from 'express';
import UserHandlers from './controllers/user_controller';
import SquadHandlers from './controllers/squad_controller';
import MealHandlers from './controllers/meal_controller';

const router = Router();

//public routes
router.post('/auth', UserHandlers.handleCreateUser);
router.get('/auth', UserHandlers.handleGetOwnedUser);

//protected routes
// User
router.get('/users', UserHandlers.handleGetUsers);
router.get('/users/:userID', UserHandlers.handleGetUserId);
router.patch('/users/:userID', UserHandlers.handleUpdate);
router.delete('/users/:userID', UserHandlers.handleDelete);

// Friend Requests
router.get('/search-users', UserHandlers.searchByEmail);
router.post('/users/send-friend-request', UserHandlers.sendFriendRequest);
router.get('/users/:userID/friend-requests', UserHandlers.getFriendRequests);
router.post('/users/accept-friend-request', UserHandlers.acceptFriendRequest);
router.post('/users/decline-friend-request', UserHandlers.declineFriendRequest);
router.get(
  '/users/by-firebase-uid/:firebaseUID',
  UserHandlers.handleGetByFirebaseUid,
);

// Squads
router.post('/squads', SquadHandlers.createSquad);
router.get('/squads', SquadHandlers.getAllSquads);
router.get('/squads/user/:userID', SquadHandlers.getUserSquads);
router.get('/squads/:squadID', SquadHandlers.getSquadById);
router.patch('/squads/:squadID', SquadHandlers.updateSquad);
router.delete('/squads/:squadID', SquadHandlers.deleteSquad);
router.post('/squads/:squadID/members', SquadHandlers.addMemberToSquad);
router.delete(
  '/squads/:squadID/members/:userID',
  SquadHandlers.removeMemberFromSquad,
);

// Meals
router.post('/meals', MealHandlers.createMeal);
router.get('/meals', MealHandlers.getAllMeals);
router.get('/meals/:mealID', MealHandlers.getMealById);
router.patch('/meals/:mealID', MealHandlers.updateMeal);
router.delete('/meals/:mealID', MealHandlers.deleteMeal);

export default router;
