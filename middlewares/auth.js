const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const users = require("../models/users");

exports.isAuthenticatedUser = catchAsyncErrors( async (req, res, next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if(!token) {
        return next(new ErrorHandler("Login first to access this resourse", 401));
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await users.findById(decode.id);

    next();
});

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        console.log(req.user);
        if(!roles.includes(req.user.role)) {
            return next(new ErrorHandler(`Role: (${req.user.role}) is not allowed to access this resource`, 403));
        }
        next();
    }
}