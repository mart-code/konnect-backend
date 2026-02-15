import {Router} from 'express';
import { signUp } from '../controllers/AuthController.js';

const AuthRoutes  = Router();

AuthRoutes.post('/signup', signUp);

export default AuthRoutes;