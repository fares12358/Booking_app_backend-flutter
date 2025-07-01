// models/Users.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  users: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      name: { type: String, required: true },
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      accessToken: { type: String },
      api: { type: String },
      role: { type: String },
      resetOTP: String,
      resetOTPExpires: Date,
    }
  ],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
