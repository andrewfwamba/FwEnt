import express from "express";
import Joi from "joi";
import User from "../models/User";
import Token from "../models/token";
import { sendEmail } from "../utilities/sendEmail";

const router = express.Router();

router.post(
  "/api/v1/resetpassword",
  async (req: express.Request, res: express.Response) => {
    try {
      const schema = Joi.object({ email: Joi.string().email().required() });
      const { error } = schema.validate(req.body);
      if (error) return res.status(400).send(error.details[0].message);

      const user = await User.findOne({ email: req.body.email });
      if (!user)
        return res.send({
          success: false,
          message: "User with given email does not exist",
        });

      let token = await Token.findOne({ userId: user._id });
      if (!token) {
        token = await new Token({
          userId: user._id,
          // Generate a 4-digit OTP
          token: Math.floor(1000 + Math.random() * 9000),
        }).save();
      }
      const otp = token.token.toString();
      const subject = "Reset Password OTP";
      const body = `<div style="background-color: #ACB6F0; border-radius: 5px;"><h4 style="font-size: 20px; margin: 3px; color: #141A3D;">Greetings from the Fireworks team</br></h4><p style="font-size: 20px;">Your password reset OTP is: ${otp}</p></div>`;
      await sendEmail(user.email, subject, body);

      res.send({
        success: true,
        message: "Password reset link sent to your email",
      });
    } catch (error) {
      res.send({ success: false, message: "An error occurred" });
      console.log(error);
    }
  }
);

router.post(
  "/api/:userId/:token",
  async (req: express.Request, res: express.Response) => {
    try {
      const schema = Joi.object({ password: Joi.string().required() });
      const { error } = schema.validate(req.body);
      if (error) return res.status(400).send(error.details[0].message);

      const user = await User.findById(req.params.userId);
      if (!user) return res.status(400).send("Invalid link or expired");

      const token = await Token.findOne({
        userId: user._id,
        token: req.params.token,
      });
      if (!token) return res.status(400).send("Invalid link or expired");

      // Update password
      user.password = req.body.password;
      await user.save();
      await token.deleteOne();

      res.send("Password reset successfully.");
    } catch (error) {
      res.send("An error occurred");
      console.log(error);
    }
  }
);

export = router;
