import * as jwt from "jsonwebtoken";
import User from "../models/User";
import { NextFunction, Request, Response } from "express";

const seckey = process.env.JWT_SECRET || "";
export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.headers && req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    try {
      // check if the user exists
      const decode = jwt.verify(token, seckey) as { userId: string };
      const user = await User.findById(decode.userId);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized access" });
      }
      // Check if the user is the current authenticated user
      // if (user._id.toString() !== req.params.userId) {
      //   return res.status(403).json({ message: "Forbidden" });
      // }

      console.log(user._id);
      // Add the user object to the request object for later use
      const userInfo = {
        name: user.name,
        email: user.email,
        phone: user.phone,
      };
      next();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // check token validity
      if (error.name === "JsonWebTokenError") {
        return res.json({ success: false, message: "Invalid Access token" });
      }
      // catch token expired error
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
}

// export function isAuth(req: Request, res: Response, next: NextFunction) => {
//   // Get the token from the request headers
//   if (req.headers && req.headers.authorization) {
//     const token = req.headers.authorization.split(" ")[1];

//     try {
//       const decode = jwt.verify(token, seckey) as { userId: string };
//       const user = await User.findById(decode.userId);

//       if (!user) {
//         return res
//           .status(401)
//           .json({ success: false, message: "Unauthorized access" });
//       }

//       // Check if the user is the current authenticated user
//       if (user._id.toString() !== req.params.userId) {
//         return res.status(403).json({ message: "Forbidden" });
//       }

//       console.log(user._id);
//       // Add the user object to the request object for later use
//       // req.user = user;
//       next();
//       // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (error: any) {
//       if (error.name === "JsonWebTokenError") {
//         return res.json({ success: false, message: "Invalid Access token" });
//       }
//       if (error.name === "TokenExpiredError") {
//         return res.json({
//           success: false,
//           message: "Session expired try sign in",
//         });
//       }

//       res
//         .status(500)
//         .json({ success: false, message: "Internal server error" });
//     }
//   } else {
//     res.json({ success: false, message: "Unauthorized access" });
//   }
// };

// export default { isAuth };
