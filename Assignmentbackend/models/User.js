import mongoose from "mongoose";
import UserSchema from "../schema/userschema.js";

const User = mongoose.model("User", UserSchema);

export default User;
