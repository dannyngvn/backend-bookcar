import express from 'express';
import tripRouter from './trip.route.js';
import transactionRouter from './transaction.route.js';
import authRouter from './auth.route.js';
import clientRouter from './client.route.js';
import logAPI from '../middlewares/logAPI.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import notificationsRouter from './notifications.route.js';
import adminRouter from './admin.route.js';
import  checkRole  from '../middlewares/checkrole.middleware.js';


const router = express.Router();

// router.use(logAPI);

router.use('/trip',tripRouter);
router.use('/transaction', authMiddleware,logAPI, transactionRouter);
router.use('/notifications', notificationsRouter);
router.use('/auth', authRouter);
router.use('/client', clientRouter);
router.use('/admin',authMiddleware,checkRole("superadmin"), adminRouter);

export default router;
