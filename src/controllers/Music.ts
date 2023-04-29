import mongoose from "mongoose";
import Music from "../models/Music";
import { Request, Response } from "express";

const createMusic = (req: Request, res: Response) => {
  const { title, artist } = req.body;
  const music = new Music({
    _id: new mongoose.Types.ObjectId(),
    title,
    artist,
  });
  return music
    .save()
    .then((music) => res.status(201).json({ music }))
    .catch((error) => res.status(500).json({ error }));
};
const getMusic = (req: Request, res: Response) => {
  const musicId = req.params.musicId;
  return Music.findById(musicId)
    .populate("artist")
    .select("-__v")
    .then((music) =>
      music
        ? res.status(200).json({ music })
        : res.status(404).json({ message: "Not found" })
    )
    .catch((error) => res.status(500).json({ error }));
};
const getAllMusic = (req: Request, res: Response) => {
  return Music.find()
    .populate("artist")
    .select("-__v")
    .then((music) => res.status(200).json({ music }))
    .catch((error) => res.status(500).json({ error }));
};
const updateMusic = (req: Request, res: Response) => {
  const musicId = req.params.musicId;
  return Music.findById(musicId)
    .then((music) => {
      if (music) {
        music.set(req.body);
        return music
          .save()
          .then((music) => res.status(201).json({ music }))
          .catch((error) => res.status(500).json({ error }));
      } else {
        res.status(404).json({ message: "Not found" });
      }
    })
    .catch((error) => res.status(500).json({ error }));
};
const deleteMusic = (req: Request, res: Response) => {
  const musicId = req.params.musicId;
  return Music.findByIdAndDelete(musicId)
    .then((music) =>
      music
        ? res.status(200).json({ message: "Song deleted" })
        : res.status(404).json({ message: "Song not found" })
    )
    .catch((error) => res.status(500).json({ error }));
};

export default {
  createMusic,
  getMusic,
  getAllMusic,
  updateMusic,
  deleteMusic,
};
