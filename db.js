import { MongoClient } from 'mongodb';
import 'dotenv/config';

// Connection URL
const url = `mongodb+srv://${process.env.BD_USENAME}:${process.env.BD_PASSWORD}@bookcar.hfhodum.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(url);

// Database Name
const dbName = process.env.BD_NAME;

export let db = {};

const connectToDB = async app => {
  try {
    await client.connect();
    const database = client.db(dbName);

    db.Trip = database.collection('Trip');
    db.Users = database.collection('Users');
    console.log('Connected successfully to server');
    app.listen(process.env.PORT, () => {
      console.log(`Server dang chay${process.env.PORT}`);
    });
  } catch (error) {
    console.log('không kết nối được vs db');
  }
};

export default connectToDB;
