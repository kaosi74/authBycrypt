import express from "express";
import bodyParser from "body-parser";
import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bycryptjs from "bcryptjs";

const app = express();
const port = 3000;
const saltRounds = 10;

import { User } from "./models/User.js";

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connected successfully");
  });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.get("/signUp", (req, res) => {
  res.sendFile(__dirname + "/public/signUp.html");
});

app.post("/signUp", (req, res) => {
  const { fName, lName, email, psw } = req.body;
  if (fName == "" || lName == "" || email == "" || psw == "") {
    res.json({
      status: "Failed",
      mesage: "Check empty field",
    });
  } else if (psw.length < 10) {
    res.json({
      status: "Failed",
      message: "Password is too short",
    });
  } else {
    User.find({ email }).then((result) => {
      if (result.length) {
        res.json({
          status: "Failed",
          message: "User with provided email already exists",
        });
      } else {
        //   Password hashing
        bycryptjs.hash(psw, saltRounds, async (err, hash) => {
          if (err) {
            res.json({
              status: "Failed",
              data: err,
            });
          }
          const newUser = new User({
            fName,
            lName,
            email,
            psw: hash,
          });
          newUser
            .save()
            .then((result) => {
              res.json({
                status: "Success",
                message: "Sign Up successful",
                data: result,
              });
            })
            .catch((err) => {
              res.json({
                status: "Failed",
                data: err,
              });
            });
        });
      }
    });
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.email;
  const loginPsw = req.body.psw;

  try {
    const result = await User.find({ email });
    const data = result[0];
    if (data) {
      console.log(data);
      const userPass = data.psw;
      bycryptjs.compare(loginPsw, userPass, (err, result) => {
        if (err) {
          console.log("Error");
        } else {
          if (result) {
            res.send("Successful");
          } else {
            res.json({
              info: "Failed",
              message: "Incorrect password",
            });
          }
        }
      });
    } else {
      res.json({
        info: "Failed",
        message: "User not found",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
