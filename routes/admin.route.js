import express from 'express';
import { ObjectId } from 'mongodb';
import { db } from '../db.js';

const router = express.Router();

// lấy toàn bộ tài xế

router.get('/driver', async (req, res) => {
  try {
    console.log('first');
    const data = await db.Users.find({}).toArray();

    res.json({
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
});
export default router;
