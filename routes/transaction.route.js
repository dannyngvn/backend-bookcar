import express from 'express';
import { db } from '../db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

//get all giao dịch của tùng user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const transaction = await db.Transaction.find({ driverID: userId }).toArray();
  const moneyUser = await db.Users.findOne({
    _id: new ObjectId(userId),
  });
  console.log(moneyUser);
  res.json({ transaction, moneyUser });
});

//thực hiện thanh toán tự động
router.post('/checkout', async (req, res) => {
  const { valueDeposit } = req.body;

  try {
    const [capcha, decodeCapcha, token] = await Promise.all([
      axios.post(
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
      ),
      axios.post('https://anticaptcha.top/api/captcha', {
        apikey: '98c74c1d4837f7148672f4765ca060b5',
        img: `data:image/png;base64,${capcha.data.imageString}`,
        type: 18,
      }),
      axios.post(
        'https://online.mbbank.com.vn/api/retail_web/internetbanking/doLogin',
        {
          captcha: decodeCapcha.data.captcha,
          deviceIdCommon: 'b2foes6s-mbib-0000-0000-2023120412444158',
          password: '5a44de2a906fb920edbc944997eeb202,',
          refNo: '63c8f1254c577525f74d124a30a15b4c-2023120500344398',
          sessionId: '',
          userId: '0912222821',
        }
      ),
    ]);
    const tokeLogin = token.data.sessionId;
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
    const getHistory = async () => {
      const response = await axios.get(
        `https://online.mbbank.com.vn/api/retail-web-transactionservice/transaction/getTransactionAccountHistory`,
        {
          accountNo: '0912222821',
          fromDate: formattedDate,
          toDate: formattedDate,
          sessionId: tokeLogin,
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
      let checkMoney = data.some(item => {
        item.description === valueDeposit.infor &&
          item.creditAmount === description.amount;
      });

      if (checkMoney) {
        res.json({
          message: 'Nạp tiền thành công',
        });
        clearInterval(interval);
      }
    };

    //creditAmount là số tiền nhận được
    //description là nội dung
  } catch (error) {}
  let interval = setInterval(getHistory, 1000);
  setTimeout(() => {
    clearInterval(interval);
  }, 5 * 60 * 1000);
});

export default router;
