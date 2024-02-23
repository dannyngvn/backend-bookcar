import express from 'express';
import 'dotenv/config';
import router from './routes/index.js';
import connectToDB from './db.js';

const app = express();

app.use(express.json());

app.use('/api/v1', router);
app.use(express.static('public'));

connectToDB(app);
