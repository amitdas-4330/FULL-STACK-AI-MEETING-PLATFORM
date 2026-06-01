const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const getUserIdFromRequest = (req) => {

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : "";

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {
    return null;
  }

};


// SIGNUP

const signup = async (req, res) => {

  try {

    const {
      name,
      email,
      password,
      profilePic = "",
    } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profilePic,
    });

    res.status(201).json({
      success: true,
      user,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};


// LOGIN

const login = async (req, res) => {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      token,
      user,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

// UPDATE PROFILE PHOTO

const updateProfilePhoto = async (req, res) => {

  try {

    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(401).json({
        message: "Login required",
      });
    }

    const { profilePic = "" } = req.body;

    if (
      profilePic &&
      !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(profilePic)
    ) {
      return res.status(400).json({
        message: "Please upload a valid image.",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        profilePic,
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};

module.exports = {
  signup,
  login,
  updateProfilePhoto,
};
