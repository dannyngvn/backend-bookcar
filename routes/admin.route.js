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

//Chỉnh sửa tài xế
router.patch('/edit-driver', async (req, res) => {
  const data = req.body;
  const id = data._id;
  console.log('edit-driver');

  try {
    console.log(data);
    delete data._id;
    await db.Users.findOneAndUpdate(
      { _id: new ObjectId(id) }, // Sử dụng _id để tìm chuyến đi cụ thể
      { $set: data },
      { new: true } // Trả về document sau khi cập nhật
    );

    res.json({
      message: 'Cập nhật thành công',
    });
  } catch (error) {
    console.log(error);
  }
});
export default router;
