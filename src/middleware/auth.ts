import mongoose from "mongoose";
import * as jwt from "jsonwebtoken";
import User from "../models/User";
import { NextFunction, Request, Response } from "express";

const isAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const seckey = process.env.JWT_SECRET || "";
      const decode = jwt.verify(token, seckey);
      const user = await User.findById(decode.userId);

      if (!user) {
        return res.json({ success: false, message: "Unauthorized access" });
      }
      req.user = user;
      next();
    } catch (error: any) {
      if (error.name === "JsonWebTokenError") {
        return res.json({ success: false, message: "Invalid Access token" });
      }
      if (error.name === "TokenExpiredError") {
        return res.json({
          success: false,
          message: "Session expired try sign in",
        });
      }

      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  } else {
    res.json({ success: false, message: "Unauthorized access" });
  }
};
