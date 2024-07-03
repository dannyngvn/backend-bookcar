import Jwt from 'jsonwebtoken';
import 'dotenv/config';
import { db } from '../db.js';

export const authMiddleware = async (req, res, next) => {
  const accessToken = req.headers['x-access-token'];
  const refreshToken = req.headers['x-refresh-token'];

  // Kiểm tra xem cả access token và refresh token có tồn tại không
  if (!accessToken || !refreshToken) {
    console.log('khong co token nao ca');
    return res.status(400).json({
      message: 'Access Token or Refresh Token is not provided',
    });
  }
// them logic  kiem tra rf token trong database
const useCheckRefreshToken = await db.Users.findOne({
  "refreshToken": refreshToken,
});


if(useCheckRefreshToken.refreshToken !== refreshToken) {
  console.log("first1")
  return res.status(400).json({
    message: 'đã đăng nhập tại nơi khac',
  });
}

  // kiểm tra rftk còn hạn hay không
  try {
    const decodedRefreshToken = Jwt.verify(
      refreshToken,
      process.env.SECRET_KEY
    );

    // Nếu không có lỗi, refresh token hợp lệ
  } catch (error) {
    if (error instanceof Jwt.TokenExpiredError) {
      console.log('rf token hết hạn');
      // Nếu refresh token hết hạn, trả về mã trạng thái 401 Unauthorized
      return res.status(402).json({
        message: 'Refresh Token het han vui long dang nhap lai',
      });
    } 
  }

  try {
    // Giải mã access token để lấy thông tin người dùng
    const decodedAccessToken = Jwt.verify(accessToken, process.env.SECRET_KEY);
    req.userId = decodedAccessToken.userId;
    

    // Nếu mọi thứ hợp lệ, tiếp tục xử lý
    next();
  } catch (error) {
    if (error instanceof Jwt.TokenExpiredError) {
      console.log('access token hết hạn');
      return res.status(401).json({
        message: 'Access Token is renewed',
      });
    }
  }
};
