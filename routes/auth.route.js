import express from 'express';
import Jwt from 'jsonwebtoken';
import { db } from '../db.js';
import multer from 'multer';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    // Giữ lại phần mở rộng của file
    const ext = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + Date.now() + '.' + ext);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();
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
  //kiểm tra xem người dùng có gửi đầy đủ tên đăng nhập và mật khẩu không ?
  if (
    !phoneNumber ||
    password ===
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  ) {
    return res.status(400).json({
      message: 'Vui lòng nhập id và mật khẩu',
    });
  }

  // lấy dữ liệu người đùng dựa trên tên đăng nhập và mật khẩu đã được gửi lên

  const existingUser = await db.Users.findOne({
    phoneNumber: phoneNumber,
    password: password,
  });

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

    existingUser,
  };

  const token = Jwt.sign(jwtPayload, process.env.SECRET_KEY, {
    expiresIn: '10s',
  });

  res.json({
    message: `xin chào ${existingUser.fullName}`,
    id: existingUser._id,
    user: jwtPayload,
    accessToken: token,
  });
});

export default router;
