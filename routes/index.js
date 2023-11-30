import express from 'express';
import tripRouter from './trip.route.js';
// import userRouter from './users.route.js';
import authRouter from './auth.route.js';
import logAPI from '../middlewares/logAPI.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(logAPI);

router.use('/trip', authMiddleware, tripRouter);
// router.use('/users', userRouter);
router.use('/auth', authRouter);

export default router;
