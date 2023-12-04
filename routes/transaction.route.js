import express from 'express';
import { db } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

//get all giao dịch của tùng user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const transaction = await db.Transaction.find({ driverID: userId }).toArray();
  const moneyUser = await db.Users.findOne({
    _id: new ObjectId(userId),
  });
  console.log(moneyUser);
  res.json({ transaction, moneyUser });
});

export default router;
