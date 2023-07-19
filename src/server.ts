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
import axios from "axios";

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
  router.get("/ping", (req, res) => {
    return res.status(200).json(null);
  });
  router.post("/test/gameresponse", async (req, res) => {
    const {
      action,
      player_id,
      currency,
      amount,
      transaction_id,
      session_id,
      type,
      round_id,
      game_uuid,
    } = req.body;
    Logging.info(req.body);
    Logging.info(req.headers);

    const merchantid = req.headers["x-merchant-id"];
    const timestamp = req.headers["x-timestamp"];
    const nonce = req.headers["x-nonce"];
    const sign = req.headers["x-sign"];

    // Logging.info(timestamp);
    // Logging.info(nonce);
    // Logging.info(sign);

    if (action === "balance") {
      try {
        const bal = await axios.post(
          "https://bitsbet.net/bitsbet-api/public/api/balance",
          {
            phone: player_id,
            currency,
            merchantid,
            timestamp,
            nonce,
            sign,
          }
        );
        if (bal.data.success) {
          const balance: number = bal.data.balance;
          Logging.info(balance);
          return res.json({ balance });
        } else {
          Logging.info("Failed to load balance");
          Logging.info(bal.data.data);
          return res.json({
            success: false,
            message: "Failed to load balance",
          });
        }
      } catch (error) {}
    } else if (action === "bet") {
      try {
        const bet = await axios.post(
          "https://bitsbet.net/bitsbet-api/public/api/place/bet",
          {
            phone: player_id,
            currency,
            transaction_id,
            player_id,
            amount,
          }
        );
        if (bet.data.success) {
          const balance: number = bet.data.balance;
          const transaction_id = bet.data.transaction;
          return res.json({ balance, transaction_id });
        } else {
          res.json({
            error_code: "INSUFFICIENT_FUNDS",
            error_description: "Not enough money to continue playing",
          });
        }
      } catch (error) {}
    } else if (action === "win") {
      try {
        const win = await axios.post(
          "https://bitsbet.net/bitsbet-api/public/api/handle/win",
          {
            currency,
            transaction_id,
            player_id,
            amount,
          }
        );
        if (win.data.success) {
          const balance: number = win.data.balance;
          const transaction_id = win.data.transaction;
          return res.json({ balance, transaction_id });
        }
      } catch (error) {}
    } else if (action === "refund") {
      try {
        const ref = await axios.post(
          "https://bitsbet.net/bitsbet-api/public/api/handle/win",
          {
            currency,
            transaction_id,
            player_id,
            amount,
          }
        );
        if (ref.data.success) {
          const balance: number = ref.data.balance;
          const transaction_id = ref.data.transaction;
          return res.json({ balance, transaction_id });
        }
      } catch (error) {}
    }
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
