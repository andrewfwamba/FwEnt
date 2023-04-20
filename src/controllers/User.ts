import * as jwt from "jsonwebtoken";
import { Request, Response } from "express";
import User, { IUserModel, IUserModelStatic } from "../models/User";

const createUser = async (req: Request, res: Response) => {
  const { name, phone, email, password } = req.body;
  const UserModel: IUserModelStatic = User;
  const isNewUser = await UserModel.isThisEmailInUse(email);
  if (!isNewUser)
    return res.json({
      success: false,
      message: "This email is already in use, try sign-in",
    });

  const user = await UserModel.create({ name, phone, email, password });

  res.json({ success: true, user });
};

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user: IUserModel | null = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
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
