const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const jobs = require("./routes/jobs");
const auth = require("./routes/auth");
const user = require("./routes/user");
const connectDatabase = require("./config/database");
const errorMiddleware = require("./middlewares/errors");
const ErrorHandler = require("./utils/errorHandler");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const { default: helmet } = require("helmet");
const { xss } = require("express-xss-sanitizer");
const hpp = require("hpp");
const cors = require("cors");
const sanitizer = require("perfect-express-sanitizer");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

dotenv.config({path : "config/config.env"});

process.on("uncaughtException", err => {
    console.log(`Error: ${err.stack}`);
    console.log(`Shutting down due to Uncaught Exception!`);
    process.exit(1);
});

connectDatabase();

const app = express();

const PORT = process.env.PORT;

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 100
});

const swaggerDocument = YAML.load("./collection/swagger.yml");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());
app.use(
  sanitizer.clean({
    xss: true,
    noSql: true,
    sql: true,
  })
);
app.use(helmet());
app.use(xss());
app.use(hpp({
    whitelist: ["positions"]
}));

app.use(limiter);

app.use(cors());

app.use("/api/v1", jobs);
app.use("/api/v1", auth);
app.use("/api/v1", user)
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "Jobbee-API"
}));

app.all("/{*splat}", (req, res, next) => {
    next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});
app.use(errorMiddleware);

const server = app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}! in ${process.env.NODE_ENV} mode`);
});

process.on("unhandledRejection", err => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down server...(due to unhandle promise rejection)`);
    server.close(() => {
        process.exit(1);
    });
});