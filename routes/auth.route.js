import express from 'express';
import Jwt from 'jsonwebtoken';

const router = express.Router();
const usersData = [
  {
    id: '2',
    username: 'dannyngvn',
    password: '123',
    phoneNumber: '0912222821',
    fullName: 'Nguyễn Quang Tùng',
    vehicleType: 5,
    vehicle: 'vios',
    carImages: '',
    userImage: '',
    licensePlates: '30A9999',
    accountBalance: 5000000,
    myTrip: [],
  },
];

router.post('/login', (req, res) => {
  const { phoneNumber, password } = req.body;
  //kiểm tra xem người dùng có gửi đầy đủ tên đăng nhập và mật khẩu không ?
  if (!phoneNumber || !password) {
    return res.status(400).json({
      message: 'Vui lòng nhập id và mật khẩu',
    });
  }

  // lấy dữ liệu người đùng dựa trên tên đăng nhập và mật khẩu đã được gửi lên
  const existingUser = usersData.find(user => {
    return user.phoneNumber === phoneNumber && user.password === password;
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
  };

  const token = Jwt.sign(jwtPayload, process.env.SECRET_KEY, {
    expiresIn: '6110s',
  });

  res.json({
    message: `xin chào ${existingUser.fullName}`,
    id: existingUser.id,
    user: jwtPayload,
    accessToken: token,
  });
});

export default router;
