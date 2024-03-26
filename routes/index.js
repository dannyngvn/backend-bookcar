import express from 'express';
import tripRouter from './trip.route.js';
import transactionRouter from './transaction.route.js';
import authRouter from './auth.route.js';
import clientRouter from './client.route.js';
import logAPI from '../middlewares/logAPI.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import notificationsRouter from './notifications.route.js';

import adminRouter from './admin.route.js';

const router = express.Router();

router.use(logAPI);

router.use('/trip', authMiddleware, tripRouter);
router.use('/transaction', authMiddleware, transactionRouter);
router.use('/notifications', notificationsRouter);
router.use('/auth', authRouter);
router.use('/client', clientRouter);
router.use('/admin', adminRouter);

export default router;
