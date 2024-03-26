import express from 'express';
import { ObjectId } from 'mongodb';

import { db } from '../db.js';

const router = express.Router();

router.get('/allpushtoken', async (req, res) => {
  console.log('lay all token push');
  const token = await db.Users.find({}).toArray();

  const allpushtoken = token.map(user => user.pushToken);
  res.json(allpushtoken);
});

export default router;
