import express from 'express';
import 'dotenv/config';
import router from './routes/index.js';
import connectToDB from './db.js';
import cors from "cors"

const app = express();
app.use(cors({
    origin: 'http://localhost:3000', // hoặc dùng '*' để cho phép tất cả các nguồn gốc
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Các phương thức HTTP được phép
    allowedHeaders: ['Content-Type', 'Authorization'], // Các tiêu đề được phép
    credentials: true // Bật gửi cookie
}));

app.use(express.json());

app.use('/api/v1', router);
app.use(express.static('public'));

connectToDB(app);
