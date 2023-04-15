import mongoose from "mongoose";
import Artist from "../models/Artist";
import { NextFunction, Request, Response } from "express";

const createArtist = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body;
  const artist = new Artist({
    _id: new mongoose.Types.ObjectId(),
    name,
  });
  return artist
    .save()
    .then((artist) => res.status(201).json({ artist }))
    .catch((error) => res.status(500).json({ error }));
};
const getArtist = (req: Request, res: Response, next: NextFunction) => {
  const artistId = req.params.artistId;
  return Artist.findById(artistId)
    .then((artist) =>
      artist
        ? res.status(200).json({ artist })
        : res.status(404).json({ message: "Not found" })
    )
    .catch((error) => res.status(500).json({ error }));
};
const getAllArtist = (req: Request, res: Response, next: NextFunction) => {
  return Artist.find()
    .then((artists) => res.status(200).json({ artists }))
    .catch((error) => res.status(500).json({ error }));
};
const updateArtist = (req: Request, res: Response, next: NextFunction) => {
  const artistId = req.params.artistId;
  return Artist.findById(artistId)
    .then((artist) => {
      if (artist) {
        artist.set(req.body);
        return artist
          .save()
          .then((artist) => res.status(201).json({ artist }))
          .catch((error) => res.status(500).json({ error }));
      } else {
        res.status(404).json({ message: "Not found" });
      }
    })
    .catch((error) => res.status(500).json({ error }));
};
const deleteArtist = (req: Request, res: Response, next: NextFunction) => {
  const artistId = req.params.artistId;
  return Artist.findByIdAndDelete(artistId)
    .then((artist) =>
      artist
        ? res.status(200).json({ message: "Artist deleted" })
        : res.status(404).json({ message: "Artist not found" })
    )
    .catch((error) => res.status(500).json({ error }));
};

export default {
  createArtist,
  getArtist,
  getAllArtist,
  updateArtist,
  deleteArtist,
};
