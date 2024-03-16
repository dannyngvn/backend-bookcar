import Jwt from 'jsonwebtoken';
import 'dotenv/config';

export const authMiddleware = (req, res, next) => {
  const token = req.headers['x-access-token'];

  if (!token) {
    return res.status(400).json({
      message: 'vui lòng đăng nhập',
    });
  }

  try {
    const decoded = Jwt.verify(token, process.env.SECRET_KEY);
    next();
  } catch (error) {
    if (error instanceof Jwt.TokenExpiredError) {
      return res.status(401).json({
        message: 'Token is expired',
      });
    }
    return res.status(401).json({
      error,
    });
  }
};
