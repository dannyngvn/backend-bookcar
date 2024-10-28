import { db } from '../db.js';
const logAPI = async (req, res, next) => {

  const data =req.body
  const action = req.headers["x-action-user"]
  const currentDate = new Date();
  if (!action) {
    console.log("No action specified in headers");
    return next(); // Không có action, bỏ qua việc ghi log
  }
  if (action === "edit-trip") {
    const dataUser = {user: req.userId,
      action: action,
      time: currentDate,
      data: data._id
    }
    console.log(dataUser, " data chinh sua")
    try {
      await db.Log.insertOne(dataUser);
    } catch (error) {
      console.log(error)
    }
  } else if (action === "add-trip") {
    const dataUser = {user: req.userId,
      action: action,
      time: currentDate,
      data: data.pickUpAddress
    }
    try {
      await db.Log.insertOne(dataUser);
    } catch (error) {
      console.log(error)
    }
  } else if (action === "accept-trip") {
    const tripId = req.path.split("/").pop();

    const dataUser = {user: req.userId,
      action: action,
      time: currentDate,
      data: tripId
    }
    try {
      await db.Log.insertOne(dataUser);
    } catch (error) {
      console.log(error)
    }
  } else if (action === "with-draw") {
    const dataUser = {user: req.userId,
      action: action,
      time: currentDate,
      data: data.amount
    }
    try {
      await db.Log.insertOne(dataUser);
    } catch (error) {
      console.log(error)
    }
  } else if (action === "add-money") {
   
    const dataUser = {user: req.userId,
      action: action,
      time: currentDate,
      data: data.amount, 
    }
    try {
      await db.Log.insertOne(dataUser);
    } catch (error) {
      console.log(error)
    }
  }
  
  console.log(action, " hanh dong")

  next();
};

export default logAPI;
