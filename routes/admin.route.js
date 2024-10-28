import express from 'express';
import { ObjectId } from 'mongodb';
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

// lấy toàn bộ tài xế

router.get('/listdriver', async (req, res) => {
  try {
    const data = await db.Users.find({ status: 'activated' }).toArray();

    res.json({
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
});

//lấy danh sách tài xế mới

router.get('/new-driver', async (req, res) => {
  try {
    const data = await db.Users.find({ status: 'not activated' }).toArray();
console.log(data)

    res.json({
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
});

// lay chuyen di moi 


router.get('/new-trip', async (req, res) => {
  try {
    const data = await db.Trip.find({ status: 'waiting' }).toArray();
console.log(data)

    res.json({
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
});

// lay chuyen di da hoan thanh 

router.get('/complete-trip', async (req, res) => {
  try {
    const data = await db.Trip.find({ status: 'complete' }).toArray();
console.log(data)

    res.json({
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
});

//lay người dùng đã chọn
router.get('/:id', async (req, res) => {
  const userId = req.params.id;
  console.log(userId);

  const data = await db.Users.findOne({ _id: new ObjectId(userId) });

  res.json({
    data: data,
  });
});

router.get('/log/:id', async (req, res) => {
  const userId = req.params.id;
  console.log("lay log")

  console.log('lay nguoi dung',userId);
  const transaction = await db.Log.find({ user: userId }).toArray();

  res.json({
    data: transaction,
  });
});

//Chỉnh sửa tài xế
router.patch('/edit-driver', async (req, res) => {
  const data = req.body;
  const id = data._id;
  console.log('edit-driver');

  try {
    console.log(data);
    delete data._id;
    await db.Users.findOneAndUpdate(
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



//add tien cho tai xe 
router.patch('/add-money', async (req, res) => {
  const { UserId, money } = req.body;
  const existingUser = await db.Users.findOneAndUpdate(
    { _id: new ObjectId(UserId) }, // Sử dụng userID để tìm người dùng cụ thể
    {
      $inc: {
        accountBalance: +money, // Sử dụng updatedTrip thay vì existingTrip
      },
    }, // Giảm số dư tài khoản
    { new: true } // Trả về document sau khi cập nhật
  );

  const transaction = {
    driverID: UserId,
    timeStamp: formattedDate, // Đảm bảo định dạng thời gian đúng
    transactionType: 'Tiền cộng từ admin',
    amount: `+ ${money}`, // Sử dụng updatedTrip thay vì existingTrip
    
  };

  await db.Transaction.insertOne(transaction);
  res.json({
    mes: "thêm thành công"
  });
});
export default router;
