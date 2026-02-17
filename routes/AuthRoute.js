import {Router} from 'express';
import { login, signUp } from '../controllers/AuthController.js';

const AuthRoutes  = Router();

AuthRoutes.post('/signup', signUp);
AuthRoutes.post('/login', login);

export default AuthRoutes;