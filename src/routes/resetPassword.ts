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
      const button =
        ' <a href="" style="background-color:#E0E3F0; border:1px solid #ffbe00; border-color:#152363; border-radius:5px; border-width:1px; color:#000000; display:inline-block; font-size:14px; font-weight:normal; letter-spacing:0px; line-height:normal; padding:12px 40px 12px 40px; text-align:center; text-decoration:none; border-style:solid; font-family:inherit;" target="_blank">Verify Email Now</a>';
      const subject = `Password reset`;
      const body = `<span style="font-size: 15px">Use this OTP to reset your account's password </span>
                    <span style="color: #000000; font-size: 15px; font-family: arial, helvetica, sans-serif">to regain access </span>
                    <span style="font-size: 18px">.</span>
                    <div style="font-family: inherit; text-align: left"><span style="color: #152363; font-size: 18px">
                    <strong>OTP: ${otp}</strong>
                    <p style="font-size: 14px">Expires in 1hour</p></span>
                    </div>`;
      const info = `  <tbody>
                    <tr>
                      <td style="padding:40px 20px 40px 20px; line-height:18px; text-align:inherit; background-color:#6e6e6e;" height="100%" valign="top" bgcolor="#6e6e6e" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 15px"><strong>You may follow these simple steps:</strong></span></div>
                      <div style="font-family: inherit; text-align: center"><br></div>
                      <div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 13px">1. Enter the otp on the OTP field on our app for verification.</span></div>
                      <div style="font-family: inherit; text-align: center"><br></div>
                      <div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 13px">2. After verification is complete you'll be prompted to input a new password.</span></div>
                      <div style="font-family: inherit; text-align: center"><br></div>
                      <div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 13px">3. Provide a secure password that you can easily remember.</span></div>
                      <div style="font-family: inherit; text-align: center"><span style="color: #152363; font-size: 13px"><strong>Congrats!! You've successfully reset your password </strong></span></div>
                      <div style="font-family: inherit; text-align: center"><br></div>
                      <div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 13px">Need support? Our support team is always</span></div>
                      <div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 13px">ready to help!</span></div><div></div></div></td>
                    </tr>
                  </tbody>`;
      await sendEmail(user.email, user.name, subject, body, info);

      res.send({
        success: true,
        message: "Password reset link sent to user's email",
      });
    } catch (error) {
      res.send({ success: false, message: "An error occurred" });
      console.log(error);
    }
  }
);

router.post(
  "/api/v1/:userId/:token",
  async (req: express.Request, res: express.Response) => {
    try {
      const schema = Joi.object({ password: Joi.string().required().min(8) });
      const { error } = schema.validate(req.body);
      if (error) return res.status(400).send(error.details[0].message);

      const user = await User.findById(req.params.userId);
      if (!user) return res.status(400).send("Invalid link or expired");

      const token = await Token.findOne({
        userId: req.params.userId, //user._id,
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
