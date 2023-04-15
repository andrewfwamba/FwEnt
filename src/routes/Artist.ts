import express from "express";
import controller from "../controllers/Artist";
const router = express.Router();

router.post("/create", controller.createArtist);
router.get("/get/:artistId", controller.getArtist);
router.get("/get", controller.getAllArtist);
router.patch("/update/:artistId", controller.updateArtist);
router.delete("/delete/:artistId", controller.deleteArtist);

export = router;
