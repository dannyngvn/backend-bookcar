import express from 'express';
import { ObjectId } from 'mongodb';
import { checkMoneyMiddleware } from '../middlewares/checkMoney.middleware.js';
import { db } from '../db.js';
import axios from 'axios';
import 'dotenv/config';

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

// lấy toàn bộ cuốc xe dang pending( đã hoàn thành )

router.get('/', async (req, res) => {
  const data = await db.Trip.find({status: "pending"}).toArray();
  const filteredData = data.map(({ clientPhone, ...rest }) => rest);
  
  res.json({
    data: filteredData ,
  });
});

//lây cuốc xe mình bắn
router.get('/mytrip', async (req, res) => {
  const userId = req.userId;

  const data = await db.Trip.find({
    originator: userId,
  }).toArray();
  res.json({
    data: data,
  });
});

//lay cuốc xe mình đang chạy
router.get('/myprocessingtrip', async (req, res) => {
  const userId = req.userId;
 
  const data = await db.Trip.find({
    'implementer._id': new ObjectId(userId),
    status: 'processing',
  }).toArray();

  res.json({
    data: data,
  });
});
//chon cuoc xe da chon
router.get('/:id', async (req, res) => {
  const tripId = req.params.id;
  const data = await db.Trip.findOne({ _id: new ObjectId(tripId) });
  const result = data; // Nếu `data` là MongoDB Document
  delete result.clientPhone;
  res.json({
    data: data,
  });
});

router.get('/clientPhone/:id', async (req, res) => {
  console.log("get sdt")
  const tripId = req.params.id;
 
 

 
  const data = await db.Trip.findOne({ _id: new ObjectId(tripId) });

  
  const result = data.clientPhone; // Nếu data là MongoDB Document
  console.log("sdt khac",result )


    res.json({ data: result });
});

//Tạo cuốc xe mới ( đã hoàn thành)

router.post('/', async (req, res) => {
  const data = req.body;
console.log(data.lap)
  
  try {    
      await db.Trip.insertOne(data);
    res.json({
      message: 'Bắn cuốc thành công',
    });
  } catch (error) {
    console.log(error)
  }
});

//Chỉnh sửa chuyến đi
router.patch('/edit', async (req, res) => {
  const data = req.body;
  const id = data._id;
 

  try {
    
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
  
  const implementer = req.userId;



  try {
    const existingTrip = await db.Trip.findOne({ _id: new ObjectId(tripId) });
    const existingUserImplementer = await db.Users.findOne({
      _id: new ObjectId(implementer),
    });

    if (existingTrip.implementer) {
      // Nếu trường implementer đã có dữ liệu, trả về thông báo hoặc thông tin phù hợp
      return res.json({ message: false });
    } else {
      const addimplementer = await db.Trip.findOneAndUpdate(
        { _id: new ObjectId(tripId) }, // Sử dụng _id để tìm chuyến đi cụ thể
        {
          $set: { status: 'processing', implementer: existingUserImplementer },
        },
        { new: true } // Trả về document sau khi cập nhật
      );

      const existingUserEditBalance = await db.Users.findOneAndUpdate(
        { _id: new ObjectId(implementer) }, // Sử dụng userID để tìm người dùng cụ thể
        {
          $inc: {
            accountBalance: -existingTrip.price,
          },
        }, // Giảm số dư tài khoản
        { new: true } // Trả về document sau khi cập nhật
      );

      try {
        const transaction = {
          driverID: implementer,
          tripID: existingTrip._id,
          timeStamp: formattedDate,
          transactionType: 'Nhận chuyến',
          amount: `${'-'} ${existingTrip.price}`,
          pickUpAddress: existingTrip.pickUpAddress,
          dropOffAddress: existingTrip.dropOffAddress,
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
  const {implementer} = req.body;
 
  

  try {
    const existingTrip = await db.Trip.findOneAndUpdate(
      { _id: new ObjectId(tripId) }, // Sử dụng _id để tìm chuyến đi cụ thể
      { $set: { status: 'pending', implementer: '' } },
      { new: true } // Trả về document sau khi cập nhật
    );
    // console.log('day la ', existingTrip);

    const existingUser = await db.Users.findOneAndUpdate(
      { _id: new ObjectId(implementer) }, // Sử dụng userID để tìm người dùng cụ thể
      {
        $inc: {
          accountBalance: +existingTrip.price,
        },
      }, // Giảm số dư tài khoản
      { new: true } // Trả về document sau khi cập nhật
    );

    try {
      const transaction = {
        driverID: implementer,
        tripID: existingTrip._id,
        timeStamp: formattedDate,
        transactionType: 'Hủy Chuyến',
        amount: `${'+'} ${existingTrip.price}`,
        pickUpAddress: existingTrip.pickUpAddress,
        dropOffAddress: existingTrip.dropOffAddress,
      };

      await db.Transaction.insertOne(transaction);
    } catch (error) {
      console.log(error);
    }

    res.json({
      message: 'đã hủy',
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
  const { originator , driver } = req.body;
  const trip = await db.Trip.findOne({ _id: new ObjectId(tripId) });
  const driverCheckCheat = await db.Users.findOne({ _id: new ObjectId(driver) });
  if (trip._id !== driverCheckCheat._id) {
    
    res.json({
      message: 'chuyến đi này  đã hủy',
      
    });
   }
  try {
  

    if (trip) {
      if (trip.status !== 'complete') {
        const updatedTrip = await db.Trip.findOneAndUpdate(
          { _id: new ObjectId(tripId) },
          { $set: { status: 'complete' } },
          { new: true }
        );

        const existingUser = await db.Users.findOneAndUpdate(
          { _id: new ObjectId(originator) }, // Sử dụng userID để tìm người dùng cụ thể
          {
            $inc: {
              accountBalance: updatedTrip.price - 5000, // Sử dụng updatedTrip thay vì existingTrip
            },
          }, // Giảm số dư tài khoản
          { new: true } // Trả về document sau khi cập nhật
        );

        const transaction = {
          driverID: originator,
          tripID: updatedTrip._id, // Sử dụng updatedTrip thay vì existingTrip
          timeStamp: formattedDate, // Đảm bảo định dạng thời gian đúng
          transactionType: 'Tiền từ cuốc bắn',
          amount: `+ ${updatedTrip.price}`, // Sử dụng updatedTrip thay vì existingTrip
          pickUpAddress: updatedTrip.pickUpAddress, // Sử dụng updatedTrip thay vì existingTrip
          dropOffAddress: updatedTrip.dropOffAddress, // Sử dụng updatedTrip thay vì existingTrip
        };

        await db.Transaction.insertOne(transaction);

        res.json({
          message: 'Đã hoàn thành',
          exitingTrip: updatedTrip, // Sử dụng updatedTrip thay vì existingTrip
        });
      } else {
        res.json({
          message: 'Trip status is already complete. No update necessary.',
        });
      }
    } else {
      res.status(404).json({
        message: 'Trip not found.',
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error);
  }
});


// lấy lịch sử cá nhân
router.post('/history', async (req, res) => {
  const { userID } = req.body;
  console.log(userID, ' id lay lich su');
  const data = await db.Trip.find(
    { status: 'complete' },
    {
      implementer: {
        $elemMatch: { _id: userID },
      },
    }
  ).toArray();
  console.log(data);
  res.json({
    data: data,
  });
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
