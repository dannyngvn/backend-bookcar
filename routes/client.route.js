import express from "express";
import { ObjectId } from "mongodb";
import { db } from "../db.js";
import axios from "axios";
import "dotenv/config";
const router = express.Router();

//api khach book xe
router.post("/bookcar", async (req, res) => {
  const data = req.body;
  console.log(data.lap);

  try {
          await db.Trip.insertOne(data);

    res.json({
      message: "Bắn cuốc thành công",
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/booklist", async (req, res) => {
  const data = await db.Trip.find({}).toArray();

  const modifiedData = data.map(
    ({ clientName, clientPhone, dropOffAddress, _id }) => {
      // Check if the clientPhone has at least 3 characters
      if (clientPhone.length >= 3) {
        const hiddenDigits =
          "*".repeat(clientPhone.length - 3) + clientPhone.slice(-3);
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
router.post("/price", async (req, res) => {
  const data = req.body;
  console.log(data);
  const wayPoints = data.wayPoints;
  const waypointsStr = wayPoints
    .map((point) => `${point.latitude},${point.longitude}`)
    .join("|");

  const apiKey = process.env.APIGGM;

  try {
    const apiUrlWithWaypoint = `https://maps.googleapis.com/maps/api/directions/json?origin=${data.pickUpPoint.latitude},${data.pickUpPoint.longitude}&destination=${data.dropOffPoint.latitude},${data.dropOffPoint.longitude}&mode=driving&waypoints=${waypointsStr}&key=${apiKey}`;

    const apiUrlNoWaypoint = `https://maps.googleapis.com/maps/api/directions/json?origin=${data.pickUpPoint.latitude},${data.pickUpPoint.longitude}&destination=${data.dropOffPoint.latitude},${data.dropOffPoint.longitude}&mode=driving&key=${apiKey}`;

    const response = await axios.get(
      wayPoints.length > 0 ? apiUrlWithWaypoint : apiUrlNoWaypoint
    );

    let distanceValue = null;

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      // Nếu có nhiều legs (nếu có waypoint), bạn cần lặp qua tất cả
      const legs = response.data.routes[0].legs;
      let totalDistance = 0;

      for (const leg of legs) {
        const distanceText = leg.distance.text; // Lấy văn bản khoảng cách cho từng leg
        const legDistance = parseFloat(
          distanceText.replace(/[^\d.]/g, "").replace(",", ".")
        );
        totalDistance += legDistance; // Cộng dồn khoảng cách
      }

      distanceValue = totalDistance; // Lưu tổng khoảng cách
      console.log(`Tổng khoảng cách: ${totalDistance} km`);
    } else {
      console.log("Không thể xác định khoảng cách.");
    }

    

    const car4 = distanceValue * 9000;
    const car7 = distanceValue * 11000;
    const car9 = distanceValue * 12000;
    const car16 = distanceValue * 14000;
    const car29 = distanceValue * 15000;
    // const priceTowLap = distanceValue * 10000 + distanceValue * 5000;

    if (data.pickUpPoint === null && data.dropOffPoint === null) {
      return res.json({
        message: "Vui lòng nhập điểm đến điểm đi",
      });
    }

    // //4 hatchback chỗ 2 chiều và VAT
    // if (data.vehicleType === "4 chỗ sedan" && data.lap && data.vat) {
    //   const priceVAT = (car4 + car4 / 2) * 0.1;
    //   const price = car4 + car4 / 2 + priceVAT;
    //   return res.json({
    //     message: "đặt xe thành công 2 chieu kem VAT",
    //     price,
    //     distanceValue: distanceValue*2,
    //   });
    // }

    //4 chỗ 2 chiều và VAT
    if (data.vehicleType === "4 chỗ sedan" && data.lap && data.vat) {
      console.log(`Khoảng cách giữa hai điểm 2c là 2: ${distanceValue*2}`);
      const priceVAT = (car4 + car4 / 2) * 0.1;
      const price = car4 + car4 / 2 + priceVAT;
      return res.json({
        message: "đặt xe thành công 2 chieu kem VAT",
        price,
        distanceValue: distanceValue*2,
      });
    }

    //4  chỗ 2 chiều và  không VAT
    if (data.vehicleType === "4 chỗ sedan" && data.lap && !data.vat) {
      console.log(`Khoảng cách giữa hai điểm 2c là 2: ${distanceValue*2}`);
      const price = car4 + car4 / 2;
      return res.json({
        message: "đặt xe thành công 2 chieu ko kem VAT",
        price,
        distanceValue: distanceValue*2,
      });
    }

    //4  chỗ 1 chiều và   VAT
    if (data.vehicleType === "4 chỗ sedan" && !data.lap && data.vat) {
      const price = car4 + car4 * 0.1;
      return res.json({
        message: "đặt xe thành công 1 chieu kem VAT",
        price,
        distanceValue,
      });
    }
    //4  chỗ 1 chiều và  không VAT
    if (data.vehicleType === "4 chỗ sedan" && !data.lap && !data.vat) {
      const price = car4;
      return res.json({
        message: "đặt xe thành công 1 chieu ko kem VAT",
        price,
        distanceValue,
      });
    }

    //7 chỗ 2 chiều và VAT
    if (data.vehicleType === "7 chỗ" && data.lap && data.vat) {
      const priceVAT = (car7 + car7 / 2) * 0.1;
      const price = car7 + car7 / 2 + priceVAT;
      return res.json({
        message: "đặt xe thành công 2 chieu kem VAT",
        price,
        distanceValue: distanceValue*2,
      });
    }

    //7  chỗ 2 chiều và  không VAT
    if (data.vehicleType === "7 chỗ" && data.lap && !data.vat) {
      const price = car7 + car7 / 2;
      return res.json({
        message: "đặt xe thành công 2 chieu ko kem VAT",
        price,
        distanceValue: distanceValue*2,
      });
    }

    //7  chỗ 1 chiều và   VAT
    if (data.vehicleType === "7 chỗ" && !data.lap && data.vat) {
      const price = car7 + car7 * 0.1;
      return res.json({
        message: "đặt xe thành công 1 chieu kem VAT",
        price,
        distanceValue,
      });
    }
    //7  chỗ 1 chiều và  không VAT
    if (data.vehicleType === "7 chỗ" && !data.lap && !data.vat) {
      const price = car7;
      return res.json({
        message: "đặt xe thành công 1 chieu ko kem VAT",
        price,
        distanceValue,
      });
    }

    //9 chỗ 2 chiều và VAT
    if (data.vehicleType === "9 chỗ" && data.lap && data.vat) {
      const priceVAT = (car9 + car9 / 2) * 0.1;
      const price = car9 + car9 / 2 + priceVAT;
      return res.json({
        message: "đặt xe thành công 2 chieu kem VAT",
        price,
        distanceValue: distanceValue*2,
      });
    }

    //9  chỗ 2 chiều và  không VAT
    if (data.vehicleType === "9 chỗ" && data.lap && !data.vat) {
      const price = car9 + car9 / 2;
      return res.json({
        message: "đặt xe thành công 2 chieu ko kem VAT",
        price,
        distanceValue: distanceValue*2,
      });
    }

    //9  chỗ 1 chiều và   VAT
    if (data.vehicleType === "9 chỗ" && !data.lap && data.vat) {
      const price = car9 + car9 * 0.1;
      return res.json({
        message: "đặt xe thành công 1 chieu kem VAT",
        price,
        distanceValue,
      });
    }
    //9  chỗ 1 chiều và  không VAT
    if (data.vehicleType === "9 chỗ" && !data.lap && !data.vat) {
      const price = car9;
      return res.json({
        message: "đặt xe thành công 1 chieu ko kem VAT",
        price,
        distanceValue,
      });
    }

    //16 chỗ 2 chiều và VAT
    if (data.vehicleType === "16 chỗ" && data.lap && data.vat) {
      const priceVAT = (car16 + car16 / 2) * 0.1;
      const price = car16 + car16 / 2 + priceVAT;
      return res.json({
        message: "đặt xe thành công 2 chieu kem VAT",
        price,
        distanceValue: distanceValue*2,
      });
    }

    //16  chỗ 2 chiều và  không VAT
    if (data.vehicleType === "16 chỗ " && data.lap && !data.vat) {
      const price = car16 + car16 / 2;
      return res.json({
        message: "đặt xe thành công 2 chieu ko kem VAT",
        price,
        distanceValue: distanceValue*2,
      });
    }

    //16  chỗ 1 chiều và   VAT
    if (data.vehicleType === "16 chỗ " && !data.lap && data.vat) {
      const price = car16 + car16 * 0.1;
      return res.json({
        message: "đặt xe thành công 1 chieu kem VAT",
        price,
        distanceValue,
      });
    }
    //16  chỗ 1 chiều và  không VAT
    if (data.vehicleType === "16 chỗ " && !data.lap && !data.vat) {
      const price = car16;
      return res.json({
        message: "đặt xe thành công 1 chieu ko kem VAT",
        price,
        distanceValue,
      });
    }

    //29 chỗ 2 chiều và VAT
    if (data.vehicleType === "29 chỗ" && data.lap && data.vat) {
      const priceVAT = (car29 + car29 / 2) * 0.1;
      const price = car29 + car29 / 2 + priceVAT;
      return res.json({
        message: "đặt xe thành công 2 chieu kem VAT",
        price,
        distanceValue: distanceValue*2,
      });
    }

    //29  chỗ 2 chiều và  không VAT
    if (data.vehicleType === "29 chỗ" && data.lap && !data.vat) {
      const price = car29 + car29 / 2;
      return res.json({
        message: "đặt xe thành công 2 chieu ko kem VAT",
        price,
        distanceValue: distanceValue*2,
      });
    }

    //29  chỗ 1 chiều và   VAT
    if (data.vehicleType === "29 chỗ" && !data.lap && data.vat) {
      const price = car29 + car29 * 0.1;
      return res.json({
        message: "đặt xe thành công 1 chieu kem VAT",
        price,
        distanceValue,
      });
    }
    //29  chỗ 1 chiều và  không VAT
    if (data.vehicleType === "29 chỗ" && !data.lap && !data.vat) {
      const price = car29;
      return res.json({
        message: "đặt xe thành công 1 chieu ko kem VAT",
        price,
        distanceValue,
      });
    }
  } catch (error) {
    console.error("Lỗi khi xử lý yêu cầu:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi xử lý yêu cầu." });
  }
});

export default router;
