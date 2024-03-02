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

router.get('/booklist', async (req, res) => {
  const data = await db.Trip.find({}).toArray();

  const modifiedData = data.map(
    ({ clientName, clientPhone, dropOffAddress, _id }) => {
      // Check if the clientPhone has at least 3 characters
      if (clientPhone.length >= 3) {
        const hiddenDigits =
          '*'.repeat(clientPhone.length - 3) + clientPhone.slice(-3);
        // Return modified object with hidden clientPhone
        return {
          clientName,
          clientPhone: hiddenDigits,
          dropOffAddress,
          _id,
        };
      } else {
        // Return original object if clientPhone has less than 3 characters
        return {
          clientName,
          clientPhone,
          dropOffAddress,
          _id,
        };
      }
    }
  );

  res.json({
    data: modifiedData,
  });
});

//api tinh tien gia xe
router.post('/price', async (req, res) => {
  const data = req.body;
  console.log(data);

  try {
    const apiKey = 'AIzaSyC60_Gw6EDpdgXvZojyyl1TaqQTtzL74wU';
    const apiUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${data.pickUpPoint.latitude},${data.pickUpPoint.longitude}&destination=${data.dropOffPoint.latitude},${data.dropOffPoint.longitude}&mode=driving&key=${apiKey}`;
    // `https://maps.googleapis.com/maps/api/directions/json?origin=21.0400413,105.8493559&destination=21.2176148,105.7929915&mode=driving&key=AIzaSyAfTs6YdTJLhcasLYHleMkwXnKS8CyEOPQ`

    const response = await axios.get(apiUrl);
    let distanceValue = null;

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      const distanceText = response.data.routes[0].legs[0].distance.text;
      distanceValue = parseFloat(
        distanceText.replace(/[^\d.]/g, '').replace(',', '.')
      );
    } else {
      console.log('Không thể xác định khoảng cách.');
    }

    console.log(`Khoảng cách giữa hai điểm là 2: ${distanceValue}`);
    const car4hat = distanceValue * 8000;
    const car4 = distanceValue * 9000;
    const car7 = distanceValue * 11000;
    const car9 = distanceValue * 12000;
    const car16 = distanceValue * 14000;
    const car29 = distanceValue * 15000;
    // const priceTowLap = distanceValue * 10000 + distanceValue * 5000;

    if (data.pickUpPoint === null && data.dropOffPoint === null) {
      return res.json({
        message: 'Vui lòng nhập điểm đến điểm đi',
      });
    }

    //4 hatchback chỗ 2 chiều và VAT
    if (data.vehicleType === '4 chỗ hatchback' && data.lap && data.vat) {
      const priceVAT = (car4hat + car4hat / 2) * 0.1;
      const price = car4hat + car4hat / 2 + priceVAT;
      return res.json({
        message: 'đặt xe thành công 2 chieu kem VAT',
        price,
      });
    }

    //4 hatchback chỗ 2 chiều và  không VAT
    if (data.vehicleType === '4 chỗ hatchback' && data.lap && !data.vat) {
      const price = car4hat + car4hat / 2;
      return res.json({
        message: 'đặt xe thành công 2 chieu ko kem VAT',
        price,
      });
    }

    //4 hatchback chỗ 1 chiều và   VAT
    if (data.vehicleType === '4 chỗ hatchback' && !data.lap && data.vat) {
      const price = car4hat + car4hat * 0.1;
      return res.json({
        message: 'đặt xe thành công 1 chieu kem VAT',
        price,
      });
    }
    //4 hatchback chỗ 1 chiều và  không VAT
    if (data.vehicleType === '4 chỗ hatchback' && !data.lap && !data.vat) {
      const price = car4hat;
      return res.json({
        message: 'đặt xe thành công 1 chieu ko kem VAT',
        price,
      });
    }

    //4 chỗ 2 chiều và VAT
    if (data.vehicleType === '4 chỗ sedan' && data.lap && data.vat) {
      const priceVAT = (car4 + car4 / 2) * 0.1;
      const price = car4 + car4 / 2 + priceVAT;
      return res.json({
        message: 'đặt xe thành công 2 chieu kem VAT',
        price,
      });
    }

    //4  chỗ 2 chiều và  không VAT
    if (data.vehicleType === '4 chỗ sedan' && data.lap && !data.vat) {
      const price = car4 + car4 / 2;
      return res.json({
        message: 'đặt xe thành công 2 chieu ko kem VAT',
        price,
      });
    }

    //4  chỗ 1 chiều và   VAT
    if (data.vehicleType === '4 chỗ sedan' && !data.lap && data.vat) {
      const price = car4 + car4 * 0.1;
      return res.json({
        message: 'đặt xe thành công 1 chieu kem VAT',
        price,
      });
    }
    //4  chỗ 1 chiều và  không VAT
    if (data.vehicleType === '4 chỗ sedan' && !data.lap && !data.vat) {
      const price = car4;
      return res.json({
        message: 'đặt xe thành công 1 chieu ko kem VAT',
        price,
      });
    }

    //7 chỗ 2 chiều và VAT
    if (data.vehicleType === '7 chỗ' && data.lap && data.vat) {
      const priceVAT = (car7 + car7 / 2) * 0.1;
      const price = car7 + car7 / 2 + priceVAT;
      return res.json({
        message: 'đặt xe thành công 2 chieu kem VAT',
        price,
      });
    }

    //7  chỗ 2 chiều và  không VAT
    if (data.vehicleType === '7 chỗ' && data.lap && !data.vat) {
      const price = car7 + car7 / 2;
      return res.json({
        message: 'đặt xe thành công 2 chieu ko kem VAT',
        price,
      });
    }

    //7  chỗ 1 chiều và   VAT
    if (data.vehicleType === '7 chỗ' && !data.lap && data.vat) {
      const price = car7 + car7 * 0.1;
      return res.json({
        message: 'đặt xe thành công 1 chieu kem VAT',
        price,
      });
    }
    //7  chỗ 1 chiều và  không VAT
    if (data.vehicleType === '7 chỗ' && !data.lap && !data.vat) {
      const price = car7;
      return res.json({
        message: 'đặt xe thành công 1 chieu ko kem VAT',
        price,
      });
    }

    //9 chỗ 2 chiều và VAT
    if (data.vehicleType === '9 chỗ' && data.lap && data.vat) {
      const priceVAT = (car9 + car9 / 2) * 0.1;
      const price = car9 + car9 / 2 + priceVAT;
      return res.json({
        message: 'đặt xe thành công 2 chieu kem VAT',
        price,
      });
    }

    //9  chỗ 2 chiều và  không VAT
    if (data.vehicleType === '9 chỗ' && data.lap && !data.vat) {
      const price = car9 + car9 / 2;
      return res.json({
        message: 'đặt xe thành công 2 chieu ko kem VAT',
        price,
      });
    }

    //9  chỗ 1 chiều và   VAT
    if (data.vehicleType === '9 chỗ' && !data.lap && data.vat) {
      const price = car9 + car9 * 0.1;
      return res.json({
        message: 'đặt xe thành công 1 chieu kem VAT',
        price,
      });
    }
    //9  chỗ 1 chiều và  không VAT
    if (data.vehicleType === '9 chỗ' && !data.lap && !data.vat) {
      const price = car9;
      return res.json({
        message: 'đặt xe thành công 1 chieu ko kem VAT',
        price,
      });
    }

    //16 chỗ 2 chiều và VAT
    if (data.vehicleType === '16 chỗ' && data.lap && data.vat) {
      const priceVAT = (car16 + car16 / 2) * 0.1;
      const price = car16 + car16 / 2 + priceVAT;
      return res.json({
        message: 'đặt xe thành công 2 chieu kem VAT',
        price,
      });
    }

    //16  chỗ 2 chiều và  không VAT
    if (data.vehicleType === '16 chỗ ' && data.lap && !data.vat) {
      const price = car16 + car16 / 2;
      return res.json({
        message: 'đặt xe thành công 2 chieu ko kem VAT',
        price,
      });
    }

    //16  chỗ 1 chiều và   VAT
    if (data.vehicleType === '16 chỗ ' && !data.lap && data.vat) {
      const price = car16 + car16 * 0.1;
      return res.json({
        message: 'đặt xe thành công 1 chieu kem VAT',
        price,
      });
    }
    //16  chỗ 1 chiều và  không VAT
    if (data.vehicleType === '16 chỗ ' && !data.lap && !data.vat) {
      const price = car16;
      return res.json({
        message: 'đặt xe thành công 1 chieu ko kem VAT',
        price,
      });
    }

    //29 chỗ 2 chiều và VAT
    if (data.vehicleType === '29 chỗ' && data.lap && data.vat) {
      const priceVAT = (car29 + car29 / 2) * 0.1;
      const price = car29 + car29 / 2 + priceVAT;
      return res.json({
        message: 'đặt xe thành công 2 chieu kem VAT',
        price,
      });
    }

    //29  chỗ 2 chiều và  không VAT
    if (data.vehicleType === '29 chỗ' && data.lap && !data.vat) {
      const price = car29 + car29 / 2;
      return res.json({
        message: 'đặt xe thành công 2 chieu ko kem VAT',
        price,
      });
    }

    //29  chỗ 1 chiều và   VAT
    if (data.vehicleType === '29 chỗ' && !data.lap && data.vat) {
      const price = car29 + car29 * 0.1;
      return res.json({
        message: 'đặt xe thành công 1 chieu kem VAT',
        price,
      });
    }
    //29  chỗ 1 chiều và  không VAT
    if (data.vehicleType === '29 chỗ' && !data.lap && !data.vat) {
      const price = car29;
      return res.json({
        message: 'đặt xe thành công 1 chieu ko kem VAT',
        price,
      });
    }
  } catch (error) {
    console.error('Lỗi khi xử lý yêu cầu:', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
  }
});

export default router;
