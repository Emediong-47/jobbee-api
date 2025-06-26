const sendToken = (user, statusCode, res) => {

    const token = user.getJwtToken();

    const options = {
        httpOnly: true,
        sameSite: "strict",
        expires: new Date(Date.now() + process.env.COOKIES_EXPIRE_TIME * 24 * 60 * 60 * 1000)
    }

    if(process.env.NODE_ENV === "production ") {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie("token", token, options)
        .json({
            success: true,
            token
        });
}

module.exports = sendToken;