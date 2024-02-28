import express from 'express';
import { ObjectId } from 'mongodb';
import { checkMoneyMiddleware } from '../middlewares/checkMoney.middleware.js';
import { db } from '../db.js';

const router = express.Router();
let today = new Date();

// Lấy thông tin ngày, tháng và năm
let day = today.getDate();
let month = today.getMonth() + 1; // Tháng bắt đầu từ 0 nên cần cộng thêm 1
let year = today.getFullYear();

// Định dạng lại để có dạng 'dd/mm/yyyy'
if (day < 10) {
  day = '0' + day; // Thêm số 0 phía trước nếu ngày chỉ có một chữ số
}
if (month < 10) {
  month = '0' + month; // Thêm số 0 phía trước nếu tháng chỉ có một chữ số
}

// Hiển thị ngày theo định dạng 'dd/mm/yyyy'
let formattedDate = day + '/' + month + '/' + year;

// lấy toàn bộ cuốc xe ( đã hoàn thành )

router.get('/', async (req, res) => {
  const data = await db.Trip.find({}).toArray();

  res.json({
    data: data,
  });
});

//chon cuoc xe da chon
router.get('/:id', async (req, res) => {
  const tripId = req.params.id;
  const data = await db.Trip.findOne({ _id: new ObjectId(tripId) });

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

//Chỉnh sửa chuyến đi
router.patch('/edit', async (req, res) => {
  const data = req.body;
  const id = data._id;
  console.log('edit trip');

  try {
    console.log(data);
    delete data._id;
    await db.Trip.findOneAndUpdate(
      { _id: new ObjectId(id) }, // Sử dụng _id để tìm chuyến đi cụ thể
      { $set: data },
      { new: true } // Trả về document sau khi cập nhật
    );

    res.json({
      message: 'Cập nhật thành công',
    });
  } catch (error) {
    console.log(error);
  }
});

//cập nhật status của chuyến đi khi nhận cuốc ( đã hoàn thành) vaf log duoc nhat ky giao dich khi nhan cuoc

router.patch('/:id', checkMoneyMiddleware, async (req, res) => {
  const tripId = req.params.id;
  const implementer = req.body;

  try {
    const existingTrip = await db.Trip.findOne({ _id: new ObjectId(tripId) });
    console.log(existingTrip);
    if (existingTrip.implementer) {
      // Nếu trường implementer đã có dữ liệu, trả về thông báo hoặc thông tin phù hợp
      return res.json({ message: false });
    } else {
      const addimplementer = await db.Trip.findOneAndUpdate(
        { _id: new ObjectId(tripId) }, // Sử dụng _id để tìm chuyến đi cụ thể
        { $set: { status: 'processing', implementer: implementer.userID } },
        { new: true } // Trả về document sau khi cập nhật
      );

      const existingUser = await db.Users.findOneAndUpdate(
        { _id: new ObjectId(implementer.userID) }, // Sử dụng userID để tìm người dùng cụ thể
        {
          $inc: {
            accountBalance: -existingTrip.price,
          },
        }, // Giảm số dư tài khoản
        { new: true } // Trả về document sau khi cập nhật
      );

      try {
        const transaction = {
          driverID: implementer.userID,
          tripID: existingTrip._id,
          timeStamp: formattedDate,
          transactionType: 'Nhận chuyến',
          amount: `${'-'} ${existingTrip.price}`,
        };

        await db.Transaction.insertOne(transaction);
      } catch (error) {
        console.log(error);
      }
      res.json({ message: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error);
  }
});

//hủy chuyến

router.patch('/cancel/:id', async (req, res) => {
  const tripId = req.params.id;
  const implementer = req.body;
  // console.log('day la id nguoi dung ', implementer.userID);

  try {
    const existingTrip = await db.Trip.findOneAndUpdate(
      { _id: new ObjectId(tripId) }, // Sử dụng _id để tìm chuyến đi cụ thể
      { $set: { status: 'pending', implementer: '' } },
      { new: true } // Trả về document sau khi cập nhật
    );
    // console.log('day la ', existingTrip);

    const existingUser = await db.Users.findOneAndUpdate(
      { _id: new ObjectId(implementer.userID) }, // Sử dụng userID để tìm người dùng cụ thể
      {
        $inc: {
          accountBalance: +existingTrip.price,
        },
      }, // Giảm số dư tài khoản
      { new: true } // Trả về document sau khi cập nhật
    );

    try {
      const transaction = {
        driverID: implementer.userID,
        tripID: existingTrip._id,
        timeStamp: formattedDate,
        transactionType: 'Hủy Chuyến',
        amount: `${'+'} ${existingTrip.price}`,
      };

      await db.Transaction.insertOne(transaction);
    } catch (error) {
      console.log(error);
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

//hoàn thành chuyến

router.patch('/complete/:id', async (req, res) => {
  const tripId = req.params.id;
  const originator = req.body;
  // console.log(originator.originator);

  try {
    const existingTrip = await db.Trip.findOneAndUpdate(
      { _id: new ObjectId(tripId) }, // Sử dụng _id để tìm chuyến đi cụ thể
      { $set: { status: 'complete' } },
      { new: true } // Trả về document sau khi cập nhật
    );

    const existingUser = await db.Users.findOneAndUpdate(
      { _id: new ObjectId(originator.originator) }, // Sử dụng userID để tìm người dùng cụ thể
      {
        $inc: {
          accountBalance: +existingTrip.price - 5000,
        },
      }, // Giảm số dư tài khoản
      { new: true } // Trả về document sau khi cập nhật
    );

    res.json({
      message: 'Đã hoàn thành',
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
