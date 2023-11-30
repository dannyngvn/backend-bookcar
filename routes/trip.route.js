// import express from 'express';
// import { ObjectId } from 'mongodb';
// import { trip, myTrip } from '../utils/mockData.js';
// import { db } from '../db.js';

// const router = express.Router();

// // lấy toàn bộ cuốc xe ( đã hoàn thành )

// router.get('/', async (req, res) => {
//   const data = await db.Trip.find({}).toArray();
//   console.log(req.headers);
//   res.json({
//     data: data,
//   });
// });

// // lấy dữ liệu cuốc xe tài xế chọn ( đã hoàn thành )

// router.get('/:id', async (req, res) => {
//   const tripId = req.params.id;
//   const data = await db.Trip.findOne({ _id: new ObjectId(tripId) });

//   if (data.status === 'processing') {
//     return res.json({
//       message: 'Đã có tài xế nhận cuốc này',
//     });
//   }

//   res.json({
//     data: data,
//   });
// });

// //Tạo cuốc xe mới ( đã hoàn thành)

// router.post('/', async (req, res) => {
//   const data = req.body;

//   try {
//     await db.Trip.insertOne(data);

//     res.json({
//       message: 'Bắn cuốc thành công',
//     });
//   } catch (error) {}
// });

// //cập nhật status của chuyến đi khi nhận cuốc ( đã hoàn thành)

// router.patch('/:id', async (req, res) => {
//   const tripId = req.params.id;
//   const implementer = req.body;
//   console.log(implementer);

//   try {
//     const updatedTrip = await db.Trip.findOneAndUpdate(
//       { _id: new ObjectId(tripId) },
//       { $set: { status: 'processing', implementer: implementer.userID } },
//       { returnOriginal: false } // Trả về document sau khi cập nhật
//     );

//     if (!updatedTrip) {
//       return res.status(404).json({ message: 'Không tìm thấy chuyến đi' });
//     }

//     res.json({
//       message: 'Đã nhận cuốc',
//       updatedTrip: updatedTrip,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // router.delete('/:id', (req, res) => {
// //   const postId = req.params.id;
// //   const existingPostIndex = posts.findIndex(post => post.id === postId);
// //   if (existingPostIndex === -1) {
// //     return res.json({
// //       message: 'Resource is not exist',
// //     });
// //   }

// //   posts.splice(existingPostIndex, 1);

// //   return res.json({
// //     message: 'Delete successfully',
// //   });
// // });

// export default router;

import express from 'express';
import { ObjectId } from 'mongodb';

import { db } from '../db.js';

const router = express.Router();

// lấy toàn bộ cuốc xe ( đã hoàn thành )

router.get('/', async (req, res) => {
  const data = await db.Trip.find({}).toArray();
  console.log(req.headers);
  res.json({
    data: data,
  });
});

// lấy dữ liệu cuốc xe tài xế chọn ( đã hoàn thành )

router.get('/:id', async (req, res) => {
  const tripId = req.params.id;
  const data = await db.Trip.findOne({ _id: new ObjectId(tripId) });

  if (data.status === 'processing') {
    return res.json({
      message: 'Đã có tài xế nhận cuốc này',
    });
  }

  res.json({
    data: data,
  });
});

//Tạo cuốc xe mới ( đã hoàn thành)

router.post('/', async (req, res) => {
  const data = req.body;

  try {
    await db.Trip.insertOne(data);

    res.json({
      message: 'Bắn cuốc thành công',
    });
  } catch (error) {}
});

//cập nhật status của chuyến đi khi nhận cuốc ( đã hoàn thành)

router.patch('/:id', async (req, res) => {
  const tripId = req.params.id;
  const implementer = req.body;
  // console.log('day la id nguoi dung ', implementer.userID);

  try {
    const existingTrip = await db.Trip.findOneAndUpdate(
      { _id: new ObjectId(tripId) }, // Sử dụng _id để tìm chuyến đi cụ thể
      { $set: { status: 'processing', implementer: implementer.userID } },
      { new: true } // Trả về document sau khi cập nhật
    );
    // console.log('day la ', existingTrip);

    const existingUser = await db.Users.findOneAndUpdate(
      { _id: new ObjectId(implementer.userID) }, // Sử dụng userID để tìm người dùng cụ thể
      {
        $inc: {
          accountBalance: -existingTrip.price,
        },
      }, // Giảm số dư tài khoản
      { new: true } // Trả về document sau khi cập nhật
    );
    console.log('day la user', existingUser);

    if (!existingTrip) {
      return res.status(404).json({ message: 'Không tìm thấy chuyến đi' });
    }

    if (existingTrip.price > existingUser.accountBalance) {
      return res.status(400).json({
        message: 'Vui lòng nạp thêm tiền',
      });
    }

    res.json({
      message: 'Đã nhận cuốc',
      exitingTrip: existingTrip,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error);
  }
});

// router.delete('/:id', (req, res) => {
//   const postId = req.params.id;
//   const existingPostIndex = posts.findIndex(post => post.id === postId);
//   if (existingPostIndex === -1) {
//     return res.json({
//       message: 'Resource is not exist',
//     });
//   }

//   posts.splice(existingPostIndex, 1);

//   return res.json({
//     message: 'Delete successfully',
//   });
// });

export default router;
