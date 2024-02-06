import express from 'express';
import Jwt from 'jsonwebtoken';
import { db } from '../db.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { phoneNumber, password } = req.body;
  //kiểm tra xem người dùng có gửi đầy đủ tên đăng nhập và mật khẩu không ?
  if (!phoneNumber || !password) {
    return res.status(400).json({
      message: 'Vui lòng nhập id và mật khẩu',
    });
  }

  // lấy dữ liệu người đùng dựa trên tên đăng nhập và mật khẩu đã được gửi lên

  const existingUser = await db.Users.findOne({ phoneNumber: phoneNumber });

  // kiểm tra xem  người dùng có tồn tại hay không
  if (!existingUser) {
    return res.status(401).json({
      message: 'Sai tên đăng nhập hoặc mật khẩu',
    });
  }

  const jwtPayload = {
    id: existingUser.id,
    username: existingUser.username,
    fullName: existingUser.fullName,
    vehicleType: existingUser.vehicleType,
    vehicle: existingUser.vehicle,
    licensePlates: existingUser.licensePlates,
    accountBalance: existingUser.accountBalance,
    role: existingUser.role,
    existingUser,
  };

  const token = Jwt.sign(jwtPayload, process.env.SECRET_KEY, {
    expiresIn: '6110s',
  });

  res.json({
    message: `xin chào ${existingUser.fullName}`,
    id: existingUser._id,
    user: jwtPayload,
    accessToken: token,
    role: role,
  });
});

export default router;
