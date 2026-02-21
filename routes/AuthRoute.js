import {Router} from 'express';
import { login, signUp, getUserInfo, updateProfile, logout } from '../controllers/AuthController.js';
import { verifyToken } from '../middlewares/AuthMiddleware.js';

const AuthRoutes  = Router();

AuthRoutes.post('/signup', signUp);
AuthRoutes.post('/login', login);
AuthRoutes.get('/user-info', verifyToken, getUserInfo);
AuthRoutes.post('/update-profile', verifyToken, updateProfile);
AuthRoutes.post('/logout', logout);

export default AuthRoutes;
