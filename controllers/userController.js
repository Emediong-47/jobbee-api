const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Job = require("../models/jobs");
const User = require("../models/users");
const APIFilters = require("../utils/apiFilters");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwtToken");
const fs = require("fs");

exports.getUserProfile = catchAsyncErrors(async (req, res, next) => {

    const user = await User.findById(req.user.id).populate({
        path: "jobPublished",
        select: "title postingDate"
    });

    res.status(200).json({
        success: true,
        data: user
    });
});

exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isMatched = await user.comparePassword(req.body.currentPassword);

    if(!isMatched) {
        return next(new ErrorHandler("Old Password is incorrect", 401));
    }

    user.password = req.body.newPassword;
    await user.save()

    sendToken(user, 200, res);
});

exports.updateUserData = catchAsyncErrors(async (req, res, next) => {

    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true
    });
    
    res.status(200).json({
        success: true,
        data: user
    });
});

exports.getAppliedJobs = catchAsyncErrors(async (req, res, next) => {
    const job = await Job.find({"applicantsApplied.id": req.user.id}).select("+applicantsApplied");

    res.status(200).json({
        success: true,
        results: job.length,
        data: job
    });
});

exports.getPublishedJobs = catchAsyncErrors(async (req, res, next) => {
    const job = await Job.find({user: req.user.id});

    res.status(200).json({
        success: true,
        results: job.length,
        data: job
    });
});

exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
    deleteUserData(req.user.id, req.user.role);

    const user = await User.findByIdAndDelete(req.user.id);
    console.log(user);

    res.cookie("token", "none", {
        expires: new Date(Date.now()),
        httpOnly: true
    });
    

    res.status(200).json({
        success: true,
        message: "Your account has been deleted!"
    });
});

exports.getUsers = catchAsyncErrors(async (req, res, next) => {
    const apiFilters = new APIFilters(User.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();

    const users = await apiFilters.query;

    res.status(200).json({
        success: true,
        results: users.length,
        data: users
    });

});

exports.deleteUserAdmin = catchAsyncErrors(async (req,res, next) => {
    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new ErrorHandler(`User not found with the id: ${req.params.id}`, 404));
    }
    
    deleteUserData(user.id, user.role);
    await user.deleteOne();

    res.status(200).json({
        success: true,
        message: "User just deleted by ADMIN!"
    });
});

async function deleteUserData(user, role) {
    if(role === "employer") {
        await Job.deleteMany(({user: user}));
    }

    if(role === "user") {
        const appliedJobs = await Job.find({"applicantsApplied.id": user}).select("+applicantsApplied");

        for (let i = 0; i < appliedJobs.length; i++) {
            const obj = appliedJobs[i].applicantsApplied.find( o => o.id === user);

            console.log(__dirname);

            let filepath = `${__dirname}/public/uploads/${obj.resume}`.replace("\\controllers", "");

            fs.unlink(filepath, err => {
                if(err) {
                    return console.log(err);
                }
            });
            appliedJobs[i].applicantsApplied.splice(appliedJobs[i].applicantsApplied.indexOf(obj.id), 1);
            
            await appliedJobs[i].save();
            
        }
    }
}