import express from "express";
import controller from "../controllers/Artist";
import { Schemas, ValidateSchema } from "../middleware/ValidateSchema";
import { isAuth } from "../middleware/auth";
const router = express.Router();

router.post(
  "/create",
  ValidateSchema(Schemas.artist.create),
  // isAuth as (req: Request & AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>,
  controller.createArtist
);
router.get("/get/:artistId", isAuth, controller.getArtist);
router.get("/get/", controller.getAllArtist);
router.patch(
  "/update/:artistId",
  ValidateSchema(Schemas.artist.update),
  controller.updateArtist
);
router.delete("/delete/:artistId", controller.deleteArtist);

export = router;
