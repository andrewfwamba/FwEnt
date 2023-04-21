import express from "express";
import controller from "../controllers/Artist";
import { Schemas, ValidateSchema } from "../middleware/ValidateSchema";

const router = express.Router();

router.post(
  "/create",
  ValidateSchema(Schemas.artist.create),
  controller.createArtist
);
router.get("/get/:artistId", controller.getArtist);
router.get("/get/", controller.getAllArtist);
router.patch(
  "/update/:artistId",
  ValidateSchema(Schemas.artist.update),
  controller.updateArtist
);
router.delete("/delete/:artistId", controller.deleteArtist);

export = router;
