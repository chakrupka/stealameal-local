// src/router.js

import { Router } from 'express';
import UserHandlers from './controllers/user_controller';
import SquadHandlers from './controllers/squad_controller';
import MealHandlers from './controllers/meal_controller';

const router = Router();

// ================================
// PUBLIC ROUTES
// ================================
// For creating a user
router.post('/auth', UserHandlers.handleCreateUser);
router.get('/auth', UserHandlers.handleGetOwnedUser);

// ================================
// PROTECTED ROUTES
// ================================

// User Routes
router.get('/users', UserHandlers.handleGetUsers);
router.get('/users/:userID', UserHandlers.handleGetUserId);
router.patch('/users/:userID', UserHandlers.handleUpdate);
router.delete('/users/:userID', UserHandlers.handleDelete);

// Friend Request Routes
router.get('/search-users', UserHandlers.searchByEmail);
router.post('/users/send-friend-request', UserHandlers.sendFriendRequest);
router.get('/users/:userID/friend-requests', UserHandlers.getFriendRequests);
router.post('/users/accept-friend-request', UserHandlers.acceptFriendRequest);
router.post('/users/decline-friend-request', UserHandlers.declineFriendRequest);
router.get(
  '/users/by-firebase-uid/:firebaseUID',
  UserHandlers.handleGetByFirebaseUid,
);

// Squad Routes
router.post('/squads', SquadHandlers.createSquad);
router.get('/squads', SquadHandlers.getAllSquads);
router.get('/squads/:squadID', SquadHandlers.getSquadById);
router.delete('/squads/:squadID', SquadHandlers.deleteSquad);
router.post('/squads/:squadID/members', SquadHandlers.addMemberToSquad);
router.delete(
  '/squads/:squadID/members/:userID',
  SquadHandlers.removeMemberFromSquad,
);

// Meal Routes
router.post('/meals', MealHandlers.createMeal);
router.get('/meals', MealHandlers.getAllMeals);
router.get('/meals/:mealID', MealHandlers.getMealById);
router.patch('/meals/:mealID', MealHandlers.updateMeal);
router.delete('/meals/:mealID', MealHandlers.deleteMeal);

// Export a proper Express Router object
export default router;
