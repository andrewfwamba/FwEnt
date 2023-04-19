import express from "express";
import controller from "../controllers/User";
import { Schemas, ValidateSchema } from "../middleware/ValidateSchema";
const router = express.Router();

router.post("/create", controller.createUser);
router.post("/signin", controller.loginUser);
// router.get("/get/:musicId", controller.getMusic);
// router.get("/get", controller.getAllMusic);
// router.patch(
//   "/update/:musicId",
//   ValidateSchema(Schemas.music.update),
//   controller.updateMusic
// );
// router.delete("/delete/:musicId", controller.deleteMusic);

export = router;
