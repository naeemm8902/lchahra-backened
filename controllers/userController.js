import UserModel from '../models/UserModel.js';
import VerificationCodeModel from '../models/VerificationCodeModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendMail } from '../helpers/Email.helper.js';

const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

const getAUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error });
  }
};

const createUser = async (req, res) => {
  try {
    console.log('Starting user creation...');
    const { name, userName, password, email } = req.body;

    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingUserName = await UserModel.findOne({ userName });
    if (existingUserName) {
      return res.status(400).json({
        message: 'Username already exists. Please choose a different Username.',
      });
    }

    const newUser = new UserModel({
      name,
      userName,
      password: password,
      email,
    });
    await newUser.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res
      .status(500)
      .json({ message: 'Error creating user', error: error.message });
  }
};

// const createUser = async (req, res) => {
//   try {
//     console.log('reached here');
//     const { name, userName, password, email } = req.body;
//     const newUser = new UserModel({ name, userName, password, email });
//     await newUser.save();
//     res.status(201).json(newUser);
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating user', error });
//   }
// };

const updateUser = async (req, res) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
};

const sendLoginCode = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: 'Email and password are required.' });
  }
  try {
    const user = await UserModel.findOne({ email });
    console.log('user is ', user);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('isMatch is ', isMatch);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const existingToken = await VerificationCodeModel.findOne({
      userId: user._id,
      isUsed: true,
      expiresAt: { $gt: new Date() },
    });

    if (existingToken) {
      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '15m' },
      );
      const refreshToken = jwt.sign(
        { userId: user._id, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '8h' },
      );

      return res.status(200).json({
        message: 'Logged in successfully.',
        accessToken,
        refreshToken,
        user,
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      console.log('signup code is ', code);
      const to = email;
      const subject = 'Lachahra Activation Code';
      const text = 'Emai';
      const html = `
      <h1>LCHAHRA</h1>
      <p>your Activation code is : <strong>${code}</strong></p>
      `;

      await sendMail(to, subject, text, html);
      console.log(code);
    } catch (error) {
      console.error('Error occurred while sending email:', error);
      return res
        .status(500)
        .json({ message: 'An error occurred while sending the login code.' });
    }

    const expiryDate = new Date(Date.now() + 30 * 60 * 1000);
    await VerificationCodeModel.create({
      userId: user._id,
      code,
      expiresAt: expiryDate,
    });
    return res.status(200).json({ message: 'Login code sent to your email.' });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'An error occurred while sending the login code.' });
  }
};

const loginWithCode = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Code are required.' });
  }
  if (code.length < 6) {
    return res.status(400).json({ message: 'Invalid code.' });
  }

  try {
    const verificationEntry = await VerificationCodeModel.findOne({
      code,
      expiresAt: { $gt: new Date() },
      isUsed: false,
    });

    if (!verificationEntry) {
      return res.status(401).json({ message: 'Invalid or expired code.' });
    }

    const user = await UserModel.findById(verificationEntry.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    const refreshToken = jwt.sign(
      { userId: user._id, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' },
    );

    await VerificationCodeModel.findByIdAndUpdate(verificationEntry._id, {
      isUsed: true,
    });

    // Update user verification status and store refresh token
    await UserModel.findByIdAndUpdate(user._id, {
      isVerified: true,
      refreshToken,
    });

    user.password = null;
    return res.status(200).json({ accessToken, refreshToken, user });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'An error occurred during the login process.' });
  }
};

const refreshToken = (req, res) => {
  res.json({ message: 'message resived' });
};
export {
  getAllUsers,
  getAUser,
  createUser,
  deleteUser,
  updateUser,
  sendLoginCode,
  loginWithCode,
  refreshToken,
};
