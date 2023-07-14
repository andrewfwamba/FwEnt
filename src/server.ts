import express from "express";
import http from "http";
import helmet from "helmet";
import mongoose from "mongoose";
import { config } from "./config/config";
import Logging from "./library/Logging";
import artistRoutes from "./routes/Artist";
import musicRoutes from "./routes/Music";
import userRoutes from "./routes/User";
import { isAuthenticated } from "./middleware/auth";
import resetPassword from "./routes/resetPassword";
import cors from "cors";
import path from "path";

const router = express();

// Connect db

mongoose
  .connect(config.mongo.url, { retryWrites: true, w: "majority" })
  .then(() => {
    Logging.info("Connected to db");
    StartServer();
  })
  .catch((error) => {
    Logging.error("Connection failed");
    Logging.error(error);
  });

/* Start server on db connect */
const StartServer = () => {
  router.use((req, res, next) => {
    /** Log request  */
    Logging.info(
      `Incoming -> Method: ${req.method} - Url: ${req.url} - IP [${req.socket.remoteAddress}]`
    );
    res.on("finish", () => {
      /* Log response */
      Logging.info(
        `Outgoing -> Method: ${req.method} - url: ${req.url} - IP: ${req.socket.remoteAddress} - status: [${res.statusCode}]`
      );
    });
    next();
  });
  router.use(express.urlencoded({ extended: true }));
  router.use(express.json());
  router.use(cors());
  router.use(helmet());
  router.use("/uploads", express.static(path.join(__dirname, "../uploads")));
  /** Rules */
  router.use((req, res, next) => {
    res.header("Acess-Control-Allow-Origin", "*");
    res.header(
      "Acess-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );

    if (req.method == "OPTIONS") {
      res.header(
        "Access-Control-Allow-Methods",
        "PUT, POST, DELETE, PATCH, GET"
      );
      return res.status(200).json({});
    }
    next();
  });
  /** App routes */
  router.use("/api/v1/users", userRoutes);
  router.use("/api/v1/artists", isAuthenticated, artistRoutes);
  router.use("/api/v1/music", musicRoutes);
  router.use(resetPassword);

  /** Check health */
  router.get(
    "/ping",
    (req, res) => Logging.info("test ok")
    // res.status(200).json({ })
  );
  router.post("/test/gameresponse", (req, res) => {
    Logging.info(req.body);
    const balance = 100;
    Logging.info(`balance: ${balance}`);
    res.status(200).json({ balance });
  });

  /** Handling errors */

  router.use((req, res) => {
    const error = new Error("Not found");
    Logging.error(error);
    return res.status(404).json({ message: error.message });
  });
  http
    .createServer(router)
    .listen(config.server.port, () =>
      Logging.info(`Server is running on port ${config.server.port}.`)
    );
};
