import express from 'express';
import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import axios from 'axios';
import 'dotenv/config';
import storage from 'node-persist';

storage.init();

const router = express.Router();
//get all giao dịch của tùng user
router.get('/', async (req, res) => {
  const userId  = req.userId;
  console.log(userId)

  const transaction = await db.Transaction.find({ driverID: userId }).toArray();
  console.log(transaction)
  const moneyUser = await db.Users.findOne({
    _id: new ObjectId(userId),
  });


  res.json({ transaction, moneyUser });
});
//rút tiền
router.post('/withdraw', async (req, res) => {
  console.log('rut tien');
  const data = req.body;
  const userId = req.userId;
  const amount = data.amount;
  const amountFormat = amount.replace(/,/g, '');
  
// console.log("ddaay la amountFormat",amountFormat, typeof(amountFormat))
  const withdrawValue = {
    ...data,
    amount: parseFloat(amountFormat),
    status: 'pending',
    driverID : userId
  
  };
  console.log(withdrawValue, typeof(withdrawValue.amount))
  // console.log(withdrawValue, typeof withdrawValue.amount, 'data hoan chinh');
  try {
    const existingUser = await db.Users.findOneAndUpdate(
      { _id: new ObjectId(userId) }, // Sử dụng userID để tìm người dùng cụ thể
      {
        $inc: {
          accountBalance: -amountFormat,
        },
      }, // Giảm số dư tài khoản
      { new: true } // Trả về document sau khi cập nhật
    );
    await db.Transaction.insertOne(withdrawValue);

    res.json({
      message: 'Rút tiền thành công',
    });
  } catch (error) {
    console.log(error);
  }
});

//thực hiện thanh toán tự động
router.post('/checkout', async (req, res) => {
  const { valueDeposit } = req.body;
  const userId = req.userId;
  console.log(userId, " nap tien")

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

// Chuyển đổi fromDate và toDate với việc đảm bảo month luôn có 2 chữ số
let fromMonth = today.getMonth() - 2; // Tính từ 3 tháng trước
if (fromMonth < 10) {
  fromMonth = '0' + fromMonth;
}

let fromDate = `${year}${fromMonth}${day}`;
let toDate = `${year}${month}${day}`;


  


  const getToken = async () => {
    const response = await axios.post(
      'https://ebank.tpb.vn/gateway/api/auth/login/v3',
      {
        deviceId: 'oXV18sNWk2tvcshevRqN67IlUeDxSBAW7pB7vyRnOwYFj',
        password: process.env.PASSWORDTPB,
        username: '04582772',
        transactionId: ""
      },
      {
        headers: {
          APP_VERSION: "2024.07.12",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "vi",
          Authorization: "Bearer",
          Connection: "keep-alive",
          "Content-Type": "application/json",
          DEVICE_ID: "oXV18sNWk2tvcshevRqN67IlUeDxSBAW7pB7vyRnOwYFj",
          DEVICE_NAME: "Chrome",
          Origin: "https://ebank.tpb.vn",
          PLATFORM_NAME: "WEB",
          PLATFORM_VERSION: "127",
          Referer: "https://ebank.tpb.vn/retail/vX/",
          SOURCE_APP: "HYDRO",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
          "sec-ch-ua":
            '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
        },
      }
    );
    const token = response.data.access_token
    console.log("token", token)
    await storage.setItem('sessionId', token); 
    const tpbToken = await storage.getItem('sessionId');
    console.log("token lay trong storage", tpbToken)   
  };
  getToken()


  const getHistory = async () => {
    const tpbToken = await storage.getItem('sessionId');
    const existingTransaction  = db.Transaction.findOne({ driverID: new ObjectId(userId),
infor: valueDeposit.infor,
amount: valueDeposit.amount,

     });
     if (existingTransaction) {
      res.json({
        message: 'Đừng gian lận địt mẹ mày',
      })
      return
     }
    if (tpbToken === undefined) {
      console.log('lay token khi chua co ssid');
      getToken();
      return
    }

    const response = await axios.post(
      `https://ebank.tpb.vn/gateway/api/smart-search-presentation-service/v2/account-transactions/find`,
      {
        pageNumber: 1,
        pageSize: 400,
        accountNo: "04582772201",
        currency: "VND",
        maxAcentrysrno: "",
        fromDate: fromDate,
        toDate: toDate,
        keyword: "",
      },
      {
        headers: {
          APP_VERSION: "2024.07.12",
          Accept: "application/json, text/plain, */*",
          "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
          Authorization: `Bearer ${tpbToken}`,
          Connection: "keep-alive",
          "Content-Type": "application/json",
          DEVICE_ID: "oXV18sNWk2tvcshevRqN67IlUeDxSBAW7pB7vyRnOwYFj",
          DEVICE_NAME: "Chrome",
          Origin: "https://ebank.tpb.vn",
          PLATFORM_NAME: "WEB",
          PLATFORM_VERSION: "127",
          SOURCE_APP: "HYDRO",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
          "sec-ch-ua":
            '"Not)A;Brand";v="99", "Google Chrome";v="127", "Chromium";v="127"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
        },
      }
    );
    
   

    const checkSSID = response.data.error;
    
    if (checkSSID=== "Unauthorized") {
      console.log('SSID het hieu luc lay lai ssid');
      getToken();
      return;
    }
    const dataHistory = response.data.transactionInfos;
    console.log(dataHistory)
    let checkMoney = dataHistory.some(item => {
      return item.description.toLowerCase().includes(valueDeposit.infor);
    });

    console.log('ma ck: ', valueDeposit.infor);
    console.log('kiem tra da co giao dich chua', checkMoney);

    if (checkMoney) {
     
      const existingUser = await db.Users.findOneAndUpdate(
        { _id: new ObjectId(userId) }, // Sử dụng userID để tìm người dùng cụ thể
        {
          $inc: {
            accountBalance: +valueDeposit.amount,
          },
        }, // Giảm số dư tài khoản
        { new: true } // Trả về document sau khi cập nhật
      );

      const transaction = {
        driverID: userId,
        timeStamp: formattedDate,
        transactionType: 'Nạp tiền',
        amount: `${'+'} ${valueDeposit.amount}`,
        infor: valueDeposit.infor
      };

      await db.Transaction.insertOne(transaction);

      clearInterval(interval);
      res.json({
        message: 'Nạp tiền thành công',
      });
    }
  };

  let interval = setInterval(getHistory, 5000);
  setTimeout(() => {
    clearInterval(interval);
  }, 5 * 60 * 1000);
});

export default router;
