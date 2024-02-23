import express from 'express';
import { ObjectId } from 'mongodb';
import { db } from '../db.js';

const router = express.Router();

// lấy toàn bộ tài xế

router.get('/driver', async (req, res) => {
  try {
    const data = await db.Users.find({ status: 'activated' }).toArray();

    res.json({
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
});

//lấy danh sách tài xế mới

router.get('/new-driver', async (req, res) => {
  try {
    const data = await db.Users.find({ status: 'not activated' }).toArray();

    res.json({
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
});

//lay người dùng đã chọn
router.get('/:id', async (req, res) => {
  const userId = req.params.id;
  console.log(userId);
  console.log('lay nguoi dung');
  const data = await db.Users.findOne({ _id: new ObjectId(userId) });

  res.json({
    data: data,
  });
});
export default router;
