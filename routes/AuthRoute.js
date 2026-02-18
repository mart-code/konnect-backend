import {Router} from 'express';
import { login, signUp, getUserInfo } from '../controllers/AuthController.js';
import { verifyToken } from '../middlewares/AuthMiddleware.js';

const AuthRoutes  = Router();

AuthRoutes.post('/signup', signUp);
AuthRoutes.post('/login', login);
AuthRoutes.post('/user-info', verifyToken, getUserInfo);

export default AuthRoutes;