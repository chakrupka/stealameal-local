import { Router } from 'express';
import UserHandlers from './controllers/user_controller';
import SquadHandlers from './controllers/squad_controller';
import MealHandlers from './controllers/meal_controller';
import PingHandlers from './controllers/ping_controller';

const router = Router();

//public routes
router.post('/auth', UserHandlers.handleCreateUser);
router.get('/auth', UserHandlers.handleGetOwnedUser);

//protected routes

// User routes
router.get('/users', UserHandlers.handleGetUsers);
router.get('/users/:userID', UserHandlers.handleGetUserId);
router.patch('/users/:userID', UserHandlers.handleUpdate);
router.patch('/users/:userID/location', UserHandlers.updateLocation);
router.delete('/users/:userID', UserHandlers.handleDelete);
router.post('/fix-location-timestamps', UserHandlers.fixMissingLocationTimestamps);

// Friend Requests routes
router.get('/search-users', UserHandlers.searchByEmail);
router.post('/users/send-friend-request', UserHandlers.sendFriendRequest);
router.get('/users/:userID/friend-requests', UserHandlers.getFriendRequests);
router.post('/users/accept-friend-request', UserHandlers.acceptFriendRequest);
router.post('/users/decline-friend-request', UserHandlers.declineFriendRequest);
router.get(
  '/users/by-firebase-uid/:firebaseUID',
  UserHandlers.handleGetByFirebaseUid,
);

// Squads routes
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

// Meals routes
router.post('/meals', MealHandlers.createMeal);
router.get('/meals', MealHandlers.getAllMeals);
router.get('/meals/:mealID', MealHandlers.getMealById);
router.patch('/meals/:mealID', MealHandlers.updateMeal);
router.delete('/meals/:mealID', MealHandlers.deleteMeal);

// Pings routes
router.post('/pings', PingHandlers.createPing);
router.get('/pings/active', PingHandlers.getActivePings);
router.post('/pings/:pingId/respond', PingHandlers.respondToPing);
router.post('/pings/:pingId/dismiss', PingHandlers.dismissPing);
router.post('/pings/:pingId/cancel', PingHandlers.cancelPing);

router.stack.forEach((route) => {
  if (route.route) {
    route.route.path = route.route.path;
  }
});

router.filter = function (callback) {
  const filteredRouter = Router();
  this.stack.forEach((route) => {
    if (route.route && callback(route.route)) {
      filteredRouter.use(route);
    }
  });
  return filteredRouter;
};

export default router;
