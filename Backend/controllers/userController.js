const User = require("../models/Users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// sign up
exports.signup = async (req, res) => {
  try {
    // fetch all the data
    const { name, email, password, dailyReminder } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check if the user already existed
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Secure password
    let hashedPassword;

    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error in handling Password",
      });
    }

    // Create user in DB
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      dailyReminder,
    });

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dailyReminder: user.dailyReminder,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered",
    });
  }
};

// login
exports.login = async (req, res) => {
  try {
    //fetch all data
    const { email, password } = req.body;

    //check both email and password are present are not
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all details",
      });
    }

    // check for registered user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "User not registered",
      });
    }

    // verify password and generate JWT token
    // if password matches
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
      };
      let token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "12h",
      });

      const options = {
        httpOnly: true,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      };

      res
        .cookie("token", token, options)
        .status(200)
        .json({
          success: true,
          message: "User Logged in succesfully",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            dailyReminder: user.dailyReminder,
          },
        });
    }

    // if password does not match
    else {
      return res.status(403).json({
        success: false,
        message: "Password entered is incorrect",
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed, please try again later",
    });
  }
};

// logout
exports.logout = async (req, res) => {
  try {
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    };
    res.clearCookie("token", options);

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
