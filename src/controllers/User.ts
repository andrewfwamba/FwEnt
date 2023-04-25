import * as jwt from "jsonwebtoken";
import { Request, Response } from "express";
import User, { IUserModel, IUserModelStatic } from "../models/User";
import { sendEmail } from "../utilities/sendEmail";

const createUser = async (req: Request, res: Response) => {
  const { name, phone, email, password, confirmpassword } = req.body;
  const UserModel: IUserModelStatic = User;
  const isNewUser = await UserModel.isThisEmailInUse(email);
  if (!isNewUser)
    return res.json({
      success: false,
      message: "This email is already in use, try sign-in",
    });

  const user = await UserModel.create({ name, phone, email, password });
  const userinfo = {
    id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
  };
  const subject = `Welcome to Fireworks Entertainment`;
  const body = `<span style="font-size: 15px">Thank you for signing up with us.  Be sure to be entertained by the best. </span>
  <span style="color: #000000; font-size: 15px; font-family: arial, helvetica, sans-serif"> </span>
  <span style="font-size: 18px">.</span>
  <div style="font-family: inherit; text-align: left"><span style="color: #152363; font-size: 18px">
  <strong>You'll never get enough 😉😜</strong>
  <p style="font-size: 14px"></p></span>
  </div>`;
  const greeting = `Welcome, ${userinfo.name}`;
  const info = `  <tbody>
  <tr>
    <td style="padding:40px 20px 40px 20px; line-height:18px; text-align:inherit; background-color:#6e6e6e;" height="100%" valign="top" bgcolor="#6e6e6e" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 15px"><strong>Welcome to Fireworks entertainment</strong></span></div>
    <div style="font-family: inherit; text-align: center"><br></div>
    <div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 13px">Enjoy Hot mixes from our super djs.</span></div>
    <div style="font-family: inherit; text-align: center"><br></div>
    <div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 13px">For all your music tastes</span></div>
    <div style="font-family: inherit; text-align: center"><br></div>
    <div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 13px">From locals to international</span></div>
    <div style="font-family: inherit; text-align: center"><span style="color: #152363; font-size: 13px"><strong>Enjoy!!</strong></span></div>
    <div style="font-family: inherit; text-align: center"><br></div>
    <div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 13px">Need support? Our support team is always</span></div>
    <div style="font-family: inherit; text-align: center"><span style="color: #ffffff; font-size: 13px">ready to help!</span></div><div></div></div></td>
  </tr>
</tbody>`;
  sendEmail(userinfo.email, greeting, subject, body, info);

  res.json({ success: true, userinfo });
};

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user: IUserModel | null = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with provided email doesn't exist",
      });
    }

    const isMatch: boolean = await user.comparePassword(password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const seckey = process.env.JWT_SECRET || "";
    const token = jwt.sign({ userId: user._id }, seckey, {
      expiresIn: "1d",
    });
    let oldTokens = user.token || [];
    if (oldTokens.length) {
      oldTokens = (oldTokens as any).filter((t: { signedAt: string }) => {
        const timeDiff = (Date.now() - parseInt(t.signedAt)) / 1000;
        if (timeDiff < 86400) {
          return t;
        }
      });
    }
    await User.findByIdAndUpdate(user._id, {
      tokens: [...oldTokens, { token, signedAt: Date.now().toString() }],
    });
    const userInfo = {
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    res.status(200).json({ success: true, userInfo, token });
  } catch (err) {
    console.error("Error while logging in user", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export default { createUser, loginUser };
