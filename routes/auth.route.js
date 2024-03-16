import express from 'express';
import Jwt from 'jsonwebtoken';
import { db } from '../db.js';
import multer from 'multer';
import { ObjectId } from 'mongodb';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public');
  },
  filename: function (req, file, cb) {
    // Giữ lại phần mở rộng của file
    const ext = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + Date.now() + '.' + ext);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post('/refresh_token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: 'Missing refresh token' });
  }
  const useCheckRefreshToken = await db.Users.findOne({
    refreshToken: refreshToken,
  });

  if (useCheckRefreshToken) {
    Jwt.verify(refreshToken, process.env.SECRET_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid refresh token' });
      }

      // Tạo một token mới
      const accessToken = Jwt.sign({ userId: decoded.userId }, secretKey, {
        expiresIn: '15m',
      });

      // Trả về token mới
      res.status(200).json({ accessToken: accessToken });
    });
  } else {
    return res.status(403).json({ message: 'token không tồn tại' });
  }
});

router.get('/:userID', async (req, res) => {
  const userId = req.params.userID;
  console.log(userId);
  const data = await db.Users.findOne({ _id: new ObjectId(userId) });

  res.json({
    data: data,
  });
});

router.post(
  '/register',
  upload.fields([
    { name: 'imageDriver', maxCount: 1 },
    { name: 'imageCar', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Lấy đường dẫn của 2 hình ảnh từ req.files
      const image1Path = req.files['imageDriver'][0].path;
      const image2Path = req.files['imageCar'][0].path;
      console.log(image1Path);
      console.log(image2Path);

      // Xử lý dữ liệu tài khoản từ req.body (nếu có)
      const phoneNumber = req.body.phoneNumber;
      const password = req.body.password;
      const vehicle = req.body.vehicle;
      const fullName = req.body.fullName;
      const licensePlates = req.body.licensePlates;
      const email = req.body.email;
      const imageDriver = image1Path;
      const imageCar = image2Path;
      const accountBalance = 0;

      // Thực hiện các xử lý khác tại đây (ví dụ: lưu vào cơ sở dữ liệu)
      await db.Users.insertOne({
        phoneNumber,
        password,
        vehicle,
        fullName,
        licensePlates,
        email,
        imageDriver,
        imageCar,
        accountBalance,
      });
      // Trả về phản hồi thành công
      res.status(200).json({ message: 'Data received successfully' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);
router.post('/login', async (req, res) => {
  const { phoneNumber, password } = req.body;

  const existingUser = await db.Users.findOne({
    phoneNumber: phoneNumber,
    password: password,
  });

  console.log(existingUser);

  // kiểm tra xem  người dùng có tồn tại hay không
  if (!existingUser) {
    return res.status(401).json({
      message: 'Sai tên đăng nhập hoặc mật khẩu',
    });
  }
  const jwtPayload = {
    userId: existingUser._id,
  };

  const accessToken = Jwt.sign(jwtPayload, process.env.SECRET_KEY, {
    expiresIn: '15m',
  });

  const refreshToken = Jwt.sign(jwtPayload, process.env.SECRET_KEY, {
    expiresIn: '7d',
  });
  console.log(refreshToken);

  await db.Users.updateOne(
    { _id: existingUser._id },
    { $set: { refreshToken } }
  );

  res.json({
    refreshToken: refreshToken,
    accessToken: accessToken,
  });
});

export default router;
