const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Users = require("../models/users");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const user = await Users.create({
    name,
    email,
    password,
    role,
  });

  sendToken(user, 200, res);
});

exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter email & Password!", 400));
  }

  const user = await Users.findOne({ email: email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password!", 401));
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid Email or Password!", 401));
  }

  sendToken(user, 200, res);
});

exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await Users.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHandler("No user found with this email.", 404));
  }

  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your password reset link is as follow: \n\n${resetUrl}\n\n If you didn't request this, then please ignore!`;

  try {
        await sendEmail({
          email: user.email,
          subject: "Jobbee-API Password Recovery",
          message,
        });
    
        res.status(200).json({
          success: true,
          message: `Email sent successfully to: ${user.email}`,
        });
    } catch (error) {
        user.resetPasswordExpired = undefined;
        user.resetPasswordToken = undefined;
    
        await user.save({ validateBeforeSave: false });
    
        return next(new ErrorHandler("Email not Sent!", 500));
    }
});

exports.resetPassword = catchAsyncErrors( async (req, res, next) => {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await Users.findOne({resetPasswordToken, resetPasswordExpired: {$gt: Date.now()}});

    if(!user) {
        return next(new ErrorHandler("Password reset token is invalid or has expired!", 400));
    }

    user.password = req.body.password;
    user.resetPasswordExpired = undefined;
    user.resetPasswordToken = undefined;

    await user.save();

    sendToken(user, 200, res);
});

exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", "none", {
        expires: new Date(Date.now()),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        message: "Logged out successfully!"
    });
})