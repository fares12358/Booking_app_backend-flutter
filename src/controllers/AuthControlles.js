import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/Users.js';
import { generateAccessToken } from '../utils/tokens.js';
import sendEmail from '../utils/sendEmail.js';
import mongoose from 'mongoose';

export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const doc = await User.findOne();
    if (!doc) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = doc.users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.accessToken = generateAccessToken({ username });
    await doc.save();

    res.status(200).json({
      statusCode: 200,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        token: user.accessToken,
        api: user.api,
        role: user.role,
        username: user.username,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
};

export const registerUser = async (req, res) => {
  const { name, username, password, api } = req.body;
  try {
    let doc = await User.findOne(); // One document holds all users
    if (!doc) {
      doc = new User({ users: [] });
    }

    const existingUser = doc.users.find(u => u.username === username);
    if (existingUser) {
      return res.status(409).json({ message: 'username already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      _id: new mongoose.Types.ObjectId(),
      name,
      username,
      password: hashedPassword,
      api,
      role: "user",
      accessToken: generateAccessToken({ username }),
    };

    doc.users.push(newUser);
    await doc.save();

    res.status(201).json({
      statusCode: 200,
      message: 'Registration successful',
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        token: newUser.accessToken,
        api: newUser.api,
        role: newUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration error', error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.resetOTP = otp;
    user.resetOTPExpires = expiry;
    await user.save();

    await sendEmail(
      email,
      'Password Reset OTP',
      `<p>Your OTP code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
    );

    res.json({ message: 'OTP sent to email' });

  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.resetOTP || !user.resetOTPExpires)
      return res.status(400).json({ message: 'Invalid or expired OTP' });

    if (user.resetOTP !== otp)
      return res.status(400).json({ message: 'Incorrect OTP' });

    if (user.resetOTPExpires < new Date())
      return res.status(400).json({ message: 'OTP expired' });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.resetOTP = null;
    user.resetOTPExpires = null;

    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    res.status(500).json({ message: 'Reset failed', error: error.message });
  }
};


export const updateUser = async (req, res) => {
  const { id, username, password, newPassword } = req.body;

  try {
    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    // Verify password only if user wants to change it
    if (newPassword) {
      if (!password)
        return res.status(400).json({ message: 'Current password required' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: 'Invalid current password' });

      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Update username if provided
    if (username) {
      user.username = username;
    }

    await user.save();
    res.statusCode(200).json({ message: 'User updated successfully',user:{username:user.username,password:user.password} });

  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
};