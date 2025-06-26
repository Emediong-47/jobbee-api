const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"]
    },
    email: {
        type: String,
        required: [true, "Please enter your email address"],
        unique: true,
        validate: [validator.isEmail, "Please enter valid email address"]
    },
    role: {
        type: String,
        enum: {
            values: ["user", "employer"],
            message: "Please select correct roles"
        },
        default: "user"
    },
    password: {
        type: String,
        required: [true, "Please enter password for your account"],
        minlength: [8, "Your password must be 8 characters long"],
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpired: String
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

userSchema.pre("save", async function(next) {

    if(!this.isModified("password")) {
        next();
    }

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.getJwtToken = function() {
    return jwt.sign({id: this._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRING_TIME
    });
}

userSchema.methods.comparePassword = async function(inputtedPassword) {
    return await bcrypt.compare(inputtedPassword, this.password);
}

userSchema.methods.getResetPasswordToken = function() {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    this.resetPasswordExpired = Date.now() + 30 * 60 * 1000;

    return resetToken;
}

userSchema.virtual("jobPublished", {
    ref: "Job",
    localField: "_id",
    foreignField: "user",
    justOne: false
});

module.exports = mongoose.model("User", userSchema);