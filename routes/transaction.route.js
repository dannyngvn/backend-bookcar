import express from 'express';
import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import axios from 'axios';

import storage from 'node-persist';

storage.init();

const router = express.Router();

//get all giao dịch của tùng user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  const transaction = await db.Transaction.find({ driverID: userId }).toArray();
  const moneyUser = await db.Users.findOne({
    _id: new ObjectId(userId),
  });

  res.json({ transaction, moneyUser });
});
//rút tiền
router.post('/withdraw', async (req, res) => {
  console.log('rut tien');
  const data = req.body;
  const userID = data.userID;
  const amount = data.amount;
  console.log(userID);

  console.log(data, ' khi nhan len');

  const amountFormat = amount.replace(/,/g, '');

  const withdrawValue = {
    ...data,
    amount: parseFloat(amountFormat),
    status: 'pending',
  };
  console.log(withdrawValue, typeof withdrawValue.amount, 'data hoan chinh');
  try {
    const existingUser = await db.Users.findOneAndUpdate(
      { _id: new ObjectId(userID) }, // Sử dụng userID để tìm người dùng cụ thể
      {
        $inc: {
          accountBalance: -amount,
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
  let formattYesterday = day - 1 + '/' + month + '/' + year;
  const getCapcha = async () => {
    const response = await axios.post(
      'https://online.mbbank.com.vn/api/retail-web-internetbankingms/getCaptchaImage',
      {
        deviceIdCommon: 'b2foes6s-mbib-0000-0000-2023120412444158',
        refNo: '2023120420144551',
        sessionId: '',
      },
      {
        headers: {
          Connection: 'keep-alive',
          Host: 'online.mbbank.com.vn',
          Origin: 'https://online.mbbank.com.vn',
          Referer: 'https://online.mbbank.com.vn/pl/login?returnUrl=%2F',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          Authorization:
            'Basic RU1CUkVUQUlMV0VCOlNEMjM0ZGZnMzQlI0BGR0AzNHNmc2RmNDU4NDNm',
        },
      }
    );
    const capcha = response.data.imageString;

    return capcha;
  };

  const antiCapcha = async () => {
    const response = await axios.post('https://anticaptcha.top/api/captcha', {
      apikey: '98c74c1d4837f7148672f4765ca060b5',
      img: `data:image/png;base64,${await getCapcha()}`,
      type: 18,
    });

    const decodeCapcha = response.data.captcha;

    return decodeCapcha;
  };

  const getToken = async () => {
    const response = await axios.post(
      'https://online.mbbank.com.vn/api/retail_web/internetbanking/doLogin',
      {
        captcha: await antiCapcha(),
        deviceIdCommon: 'b2foes6s-mbib-0000-0000-2023120412444158',
        password: '3702935ef883958108f553971fe3c167',
        refNo: '63c8f1254c577525f74d124a30a15b4c-2023120621385740',

        userId: '0912222821',
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Refno: '0912222821-2024011622123959',
          Deviceid: '0l224vhw-mbib-0000-0000-2024011621001562',
          Connection: 'keep-alive',
          Host: 'online.mbbank.com.vn',
          Origin: 'https://online.mbbank.com.vn',
          Referer:
            'https://online.mbbank.com.vn/information-account/source-account',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          Authorization:
            'Basic RU1CUkVUQUlMV0VCOlNEMjM0ZGZnMzQlI0BGR0AzNHNmc2RmNDU4NDNm',
        },
      }
    );
    await storage.setItem('sessionId', response.data.sessionId);
  };

  const getHistory = async () => {
    const sessionId = await storage.getItem('sessionId');

    console.log('sessionId: ', sessionId);
    if (sessionId === undefined) {
      console.log('lay token khi chua co ssid');
      getToken();
      return
    }

    const response = await axios.post(
      `https://online.mbbank.com.vn/api/retail-transactionms/transactionms/get-account-transaction-history`,
      {
        accountNo: '0912222821',
        fromDate: formattYesterday,
        toDate: formattedDate,
        sessionId: sessionId,
        refNo: '0912222821-2024011622503914',
        deviceIdCommon: 'b2foes6s-mbib-0000-0000-2023120412444158',
      },
      {
        headers: {
          Connection: 'keep-alive',
          Host: 'online.mbbank.com.vn',
          Origin: 'https://online.mbbank.com.vn',
          Referer:
            'https://online.mbbank.com.vn/information-account/source-account',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          Authorization:
            'Basic RU1CUkVUQUlMV0VCOlNEMjM0ZGZnMzQlI0BGR0AzNHNmc2RmNDU4NDNm',
          'Content-Type': 'application/json; charset=utf-8',
          Refno: '0912222821-2024011622503914',
          Deviceid: '0l224vhw-mbib-0000-0000-2024011621001562',
        },
      }
    );
    const dataHistory = response.data.transactionHistoryList;
    const checkSSID = response.data.result.ok;
    console.log('kiem tra ssid con hieu luc khong ? ', checkSSID);
    console.log('dạnh sach mang tra ve', dataHistory);

    if (!checkSSID) {
      console.log('SSID het hieu luc lay lai ssid');
      getToken();
      return;
    }

    let checkMoney = dataHistory.some(item => {
      return item.addDescription.toLowerCase().includes(valueDeposit.infor);
    });

    console.log('ma ck: ', valueDeposit.infor);
    console.log('kiem tra da co giao dich chua', checkMoney);

    if (checkMoney) {
      res.json({
        message: 'Nạp tiền thành công',
      });
      const existingUser = await db.Users.findOneAndUpdate(
        { _id: new ObjectId(valueDeposit.userID) }, // Sử dụng userID để tìm người dùng cụ thể
        {
          $inc: {
            accountBalance: +valueDeposit.amount,
          },
        }, // Giảm số dư tài khoản
        { new: true } // Trả về document sau khi cập nhật
      );

      const transaction = {
        driverID: valueDeposit.userID,
        timeStamp: formattedDate,
        transactionType: 'Nạp tiền',
        amount: `${'+'} ${valueDeposit.amount}`,
      };

      await db.Transaction.insertOne(transaction);

      clearInterval(interval);
    }
  };

  let interval = setInterval(getHistory, 5000);
  setTimeout(() => {
    clearInterval(interval);
  }, 5 * 60 * 1000);
});

export default router;
