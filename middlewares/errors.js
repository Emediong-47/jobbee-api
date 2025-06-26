const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    const env = (process.env.NODE_ENV || '').trim();

    if (env === "development") {
        return res.status(err.statusCode).json({
            success: false,
            error: err,
            errMessage: err.message,
            stack: err.stack
        });
    }
    console.log(`NODE_ENV raw value is: [${process.env.NODE_ENV}]`);


    if (env === "production") {
        let error = {...err};

        error.message = err.message;

        if(err.name === "CastError") {
            const message = `Resource not found. Invalid ${err.path}`
            error = new ErrorHandler(message, 404);
        }

        if(err.name === "ValidationError") {
            const message = Object.values(err.errors).map(value => value.message);
            error = new ErrorHandler(message, 400);
        }

        if(err.message === "JsonWebTokenError") {
            const message = "JSON Web Token is invalid. Try Again!";
            error = new ErrorHandler(message, 500);
        }

        if(err.message === "TokenExpiredError") {
            const message = "JSON Web Token is expired. Try Again!";
            error = new ErrorHandler(message, 500);
        }

        if(err.code === 11000) {
            const message =  `Duplicate ${Object.keys(err.keyValue)} entered.`;
            error = new ErrorHandler(message, 400);
        }

        return res.status(error.statusCode).json({
            success: false,
            message: error.message || "Internal Server Error.",
        });

    }
}