import express from 'express';
import { ObjectId } from 'mongodb';
import { checkMoneyMiddleware } from '../middlewares/checkMoney.middleware.js';
import { db } from '../db.js';
import axios from 'axios';

const router = express.Router();

//api khach book xe
router.post('/bookcar', async (req, res) => {
  const data = req.body;

  try {
    await db.Trip.insertOne(data);

    res.json({
      message: 'đặt xe thành công',
    });
  } catch (error) {}
});

//api tinh tien gia xe
router.post('/price', async (req, res) => {
  const data = req.body;
  console.log(data);

  try {
    const apiKey = 'AIzaSyAfTs6YdTJLhcasLYHleMkwXnKS8CyEOPQ';
    const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${data.pickUpPoint.latitude},${data.pickUpPoint.longitude}&destination=${data.dropOffPoint.latitude},${data.dropOffPoint.longitude}&mode=driving&key=${apiKey}`;

    const response = await axios.get(apiUrl);
    let distanceValue = null;

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      const distanceText = response.data.routes[0].legs[0].distance.text;
      distanceValue = parseFloat(distanceText);
    } else {
      console.log('Không thể xác định khoảng cách.');
    }

    console.log(`Khoảng cách giữa hai điểm là: ${distanceValue}`);
    const priceOneLap = distanceValue * 10000;
    const priceTowLap = distanceValue * 10000 + distanceValue * 5000;
    console.log('day là gia 2 chieu khong vat', priceTowLap);
    console.log(priceOneLap);
    if (data.pickUpPoint === null && data.dropOffPoint === null) {
      return console.log('nap diem den va diem di');

      // return res.json({
      //   message: 'Vui lòng nhập điểm đến điểm đi',
      // });
    }
    if (data.lap && data.vat) {
      const priceTowLapVat = priceTowLap + priceTowLap * 0.1;
      return res.json({
        message: 'đặt xe thành công 2 chieu kem VAT',
        priceTowLapVat,
      });
    }
    if (data.lap && !data.vat) {
      return res.json({
        message: 'đặt xe thành công 2 chieu ko kem VAT',
        priceTowLap,
      });
    }
    if (!data.lap && data.vat) {
      const priceOneLapVat = priceOneLap + priceOneLap * 0.1;
      return res.json({
        message: 'đặt xe thành công 1 chieu kem VAT',
        priceOneLapVat,
      });
    }
    if (!data.lap && !data.vat) {
      return res.json({
        message: 'đặt xe thành công 1 chieu ko kem VAT',
        priceOneLap,
      });
    }
  } catch (error) {
    console.error('Lỗi khi xử lý yêu cầu:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
  }
});

export default router;
