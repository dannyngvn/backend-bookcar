import { ObjectId } from 'mongodb';

import { db } from '../db.js';

export const checkMoneyMiddleware = async (req, res, next) => {
  const tripId = req.params.id;
  const implementer = req.body;

  try {
    const priceTrip = await db.Trip.findOne({ _id: new ObjectId(tripId) });
    const moneyUser = await db.Users.findOne({
      _id: new ObjectId(implementer.userID),
    });
    if (!priceTrip) {
      return res.status(404).json({ message: 'Không tìm thấy chuyến đi' });
    }

    if (priceTrip.price > moneyUser.accountBalance) {
      return res.status(400).json({
        message: 'Vui lòng nạp thêm tiền',
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      error,
    });
  }
};
