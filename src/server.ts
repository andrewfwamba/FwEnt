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
      game_uuid,
      transaction_id,
      session_id,
      round_id,
      finished,
      type,
      bet_transaction_id,
    } = req.body;
    Logging.info(req.body);
    Logging.info(req.headers);

    const timestamp = req.headers["x-timestamp"];
    const nonce = req.headers["x-nonce"];
    const sign = req.headers["x-sign"];

    if (action === "balance") {
      const bal = await axios.post(
        "https://bitsbet.net/bitsbet-api/public/api/balance",
        {
          player_id,
          timestamp,
          nonce,
          sign,
        }
      );
      if (bal.data.success) {
        const balance = parseFloat(bal.data.balance).toFixed(4);
        Logging.info(balance);
        return res.json({ balance });
      } else if (bal.data.data === "user not valid") {
        console.log("User does not exist");
        return res.json({
          error_code: "INTERNAL_ERROR",
          error_description: "User does not exist",
        });
      } else {
        console.log("INTERNAL_ERROR", "invalid signature");
        return res.json({
          error_code: "INTERNAL_ERROR",
          error_description: "invalid signature",
        });
      }
    } else if (action === "bet") {
      if (amount == 0) {
        const req = await axios.post(
          "https://bitsbet.net/bitsbet-api/public/api/zero/bet",
          {
            player_id,
            currency,
            transaction_id,
            round_id,
            type,
            action,
            session_id,
            amount,
            nonce,
            timestamp,
            sign,
          }
        );
        if (req.data.success) {
          const balance: number = req.data.balance;
          const transaction_id = req.data.transaction;
          return res.json({ balance, transaction_id });
        }
      }

      //
      const bet = await axios.post(
        "https://bitsbet.net/bitsbet-api/public/api/place/bet",
        {
          player_id,
          currency,
          transaction_id,
          game_uuid,
          round_id,
          session_id,
          finished,
          amount,
          nonce,
          timestamp,
          sign,
        }
      );
      if (bet.data.success) {
        const balance: number = bet.data.balance;
        const transaction_id = bet.data.transaction;
        return res.json({ balance, transaction_id });
      } else if (bet.data.balance === "balance below bet amount") {
        console.log("insufficient funds");
        return res.json({
          error_code: "INSUFFICIENT_FUNDS",
          error_description: "Not enough money to continue playing",
        });
      } else {
        console.log("INSUFFICIENT_FUNDS");
        return res.json({
          error_code: "INSUFFICIENT_FUNDS",
          error_description: "Not enough money to continue playing",
        });
      }
    } else if (action === "win") {
      if (amount == 0) {
        const req = await axios.post(
          "https://bitsbet.net/bitsbet-api/public/api/zero/bet",
          {
            player_id,
            action,
            currency,
            game_uuid,
            transaction_id,
            round_id,
            type,
            session_id,
            amount,
            nonce,
            timestamp,
            sign,
          }
        );
        const balance = req.data.balance;
        return res.json({ balance, transaction_id });
      }

      const win = await axios.post(
        "https://bitsbet.net/bitsbet-api/public/api/handle/win",
        {
          action,
          session_id,
          round_id,
          finished,
          game_uuid,
          type,
          nonce,
          sign,
          timestamp,
          transaction_id,
          player_id,
          amount,
        }
      );
      if (win.data.success) {
        const balance: number = win.data.balance;
        const transaction_id = win.data.transaction;
        return res.json({ balance, transaction_id });
      } else if (win.data.data === "invalid signature from proxy") {
        return res.json({
          error_code: "INTERNAL_ERROR",
          error_description: "invalid signature",
        });
      } else if (
        win.data.error.transaction_id ===
        "The transaction id has already been taken."
      ) {
        console.log("INTERNAL_ERROR", "duplicate transaction");
        return res.json({
          error_code: "INTERNAL_ERROR",
          error_description: "duplicate transaction",
        });
      } else {
        console.log("INTERNAL_ERROR", "invalid signature");
        return res.json({
          error_code: "INTERNAL_ERROR",
          error_description: "invalid signature",
        });
      }
    } else if (action === "refund") {
      if (amount == 0) {
        const req = await axios.post(
          "https://bitsbet.net/bitsbet-api/public/api/zero/refund",
          {
            player_id,
            action,
            currency,
            transaction_id,
            round_id,
            type,
            session_id,
            amount,
            nonce,
            timestamp,
            bet_transaction_id,
            sign,
          }
        );
        const balance = req.data.balance;
        return res.json({ balance, transaction_id });
      }
      const ref = await axios.post(
        "https://bitsbet.net/bitsbet-api/public/api/handle/refund",
        {
          action,
          session_id,
          round_id,
          finished,
          type,
          nonce,
          sign,
          timestamp,
          transaction_id,
          bet_transaction_id,
          player_id,
          amount,
        }
      );
      if (ref.data.success) {
        const balance: number = ref.data.balance;
        const transaction_id = ref.data.transaction;
        return res.json({ balance, transaction_id });
      } else if (
        ref.data.error.transaction_id ===
        "The transaction id has already been taken."
      ) {
        console.log("INTERNAL_ERROR", "duplicate transaction");
        return res.json({
          error_code: "INTERNAL_ERROR",
          error_description: "duplicate transaction",
        });
      } else {
        console.log("INTERNAL_ERROR", "invalid signature");
        return res.json({
          error_code: "INTERNAL_ERROR",
          error_description: "invalid signature",
        });
      }
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
