import express from 'express';
import { db } from '../db.js';
import { ObjectId } from 'mongodb';
import axios from 'axios';

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

//thực hiện thanh toán tự động
router.post('/checkout', async (req, res) => {
  const { valueDeposit } = req.body;
  // let sessionId = null;
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
        password: '5a44de2a906fb920edbc944997eeb202',
        refNo: '63c8f1254c577525f74d124a30a15b4c-2023120621385740',

        userId: '0912222821',
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
        },
      }
    );
    const token = response.data.sessionId;
    console.log('dayla token ', token);

    global.sessionId = token;
    // setTimeout(() => {
    //   delete global.sessionId; // Xóa biến global sau 5 phút
    // }, 5 * 60 * 1000); // 5 phút = 5 * 60 * 1000 milliseconds
  };

  const getHistory = async () => {
    console.log('day la ssid ', sessionId);
    console.log(formattedDate);
    const response = await axios.post(
      `https://online.mbbank.com.vn/api/retail-web-transactionservice/transaction/getTransactionAccountHistory`,
      {
        accountNo: '0912222821',
        fromDate: formattedDate,
        toDate: formattedDate,
        sessionId: sessionId,
        refNo: '0912222821-2023120501180987',
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
        },
      }
    );
    const data = response.data.transactionHistoryList;
    const checkSSID = response.data.result.ok;
    if (!checkSSID) {
      await getToken();
    }
    console.log('đây mảng trả về ', data);
    let checkMoney = data.some(item => {
      return item.description.includes(valueDeposit.infor);
    });

    console.log(valueDeposit.infor);
    console.log(checkMoney);

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

  let interval = setInterval(getHistory, 1000);
  setTimeout(() => {
    clearInterval(interval);
  }, 5 * 60 * 1000);
  //creditAmount là số tiền nhận được
  //description là nội dung
});

export default router;
