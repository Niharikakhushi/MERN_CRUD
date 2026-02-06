import mongoose from "mongoose";

const connectdb = async () => {
  const mongoUrl =
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/assignment_db";

  try {
    await mongoose.connect(mongoUrl);
    console.log("MongoDB connected");
  } catch (err) {
    console.log("Error connecting to MongoDB", err);
  }
};

export default connectdb;
  







  



  






