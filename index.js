import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import fileUpload from "express-fileupload";
const __dirname = path.resolve();

// setup
dotenv.config();

// mongoose strickQuery
mongoose.set('strictQuery', true);

// import routes
import User from "./route/User.js";
import Account from "./route/Account.js";
import Wallet from "./route/Wallet.js";
import Transaction from "./route/Transaction.js";
import ArtimeTopup from "./route/Airtime.js";
import InternetTopup from "./route/Internet.js";
import Spectranet from "./route/Spectranet.js";
import Smile from "./route/Smile.js";
import RechargeCard from "./route/RechargeCard.js" // recharge card printing 
import TransactionPin from "./route/TransactionPin.js";
import IkejaElectric from "./route/IkejaApi.js";
import Waec from "./route/education/WaecApi.js";
import WaecResult from "./route/education/WaecResult.js";
import JambVending from "./route/education/JambPinVending.js";
import TvPayment from "./route/TvPayment.js";
import Settlement from "./route/Settlement.js";
import Profile from "./route/Profile.js";

// initialize app
const app = express();

// configure middlewares resources...
app.use(fileUpload());
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({ extended: true, limit: "50mb", parameterLimit: 1000000 })
);
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// connect to mongo-db
mongoose
  .connect(process.env.MONGO_URI)
  .then((conn) => console.log("database connection success..."))
  .catch((err) => console.log("database connection failed" + err));

// configure app routes
app.use("/user", User);
app.use("/account", Account);
app.use("/wallet", Wallet);
app.use("/transaction", Transaction);
app.use("/airtime", ArtimeTopup);
app.use("/internet", InternetTopup);
app.use("/smile", Smile);
app.use("/spectranet", Spectranet);
app.use("/recharge", RechargeCard);
app.use("/transaction_pin", TransactionPin);
app.use("/phcn", IkejaElectric);
app.use("/waec", Waec);
app.use("/waec-result", WaecResult);
app.use("/jamb", JambVending);
app.use("/tv", TvPayment);
app.use("/settlement", Settlement);
app.use("/profile", Profile);


const PORT = process.env.PORT || 5000;
// run environment
app.listen(PORT, () => console.log("App Started..."))