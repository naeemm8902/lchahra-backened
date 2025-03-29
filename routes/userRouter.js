import express from 'express';
import {
  getAllUsers,
  getAUser,
  createUser,
  deleteUser,
  updateUser,
  loginWithCode,
  sendLoginCode,
  refreshToken,
} from '../controllers/userController.js';
const usersRouter = express.Router();

usersRouter.route('/').get(getAllUsers).post(createUser);

// Routes for a single user by ID
usersRouter.route('/login/sendcode').post(sendLoginCode);
usersRouter.route('/login/loginwithcode').post(loginWithCode);
usersRouter.route('/refreshtoken').post(refreshToken);
usersRouter.route('/:id').get(getAUser).patch(updateUser).delete(deleteUser);

export default usersRouter;
