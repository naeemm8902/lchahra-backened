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
  changePassword,
} from '../controllers/userController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
const usersRouter = express.Router();

usersRouter.route('/')
.post(createUser)
.get(getAllUsers);
// usersRouter.route('/update/changeusername').post(isAuthenticated, updateUser);
usersRouter.route('/update/user-name').post(isAuthenticated, updateUser)
// Routes for a single user by ID
usersRouter.route('/login/sendcode').post(sendLoginCode);
usersRouter.route('/login/loginwithcode').post(loginWithCode);
usersRouter.route('/refreshtoken').post(refreshToken);
usersRouter.route('/changepassword').post(isAuthenticated, changePassword);
usersRouter.route('/get-user-deails').get(isAuthenticated, getAUser)
usersRouter.route('/:id')
.get(getAUser)
.delete(deleteUser);

export default usersRouter;
