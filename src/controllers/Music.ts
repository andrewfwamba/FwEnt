import mongoose from "mongoose";
import Music from "../models/Music";
import { Request, Response } from "express";
import path from "path";
import * as fs from "fs";
import Logging from "../library/Logging";

const createMusic = (req: Request & { file?: any }, res: Response) => {
  const { title, artist } = req.body;
  // Get file details from req.file
  const file = req.file;
  const url = path.join(req.file.destination, req.file.filename);

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const music = new Music({
    _id: new mongoose.Types.ObjectId(),
    title,
    url,
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
        : res.status(404).json({ success: true, message: "Not found" })
    )
    .catch((error) => res.status(500).json({ error }));
};
const getAllMusic = (req: Request, res: Response) => {
  return Music.find()
    .populate("artist")
    .select("-__v")
    .then((music) => res.status(200).json({ success: true, music }))
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

const stream = async (req: Request, res: Response) => {
  try {
    const title = req.params.title;
    const music = await Music.findOne({ title });
    if (!music) {
      return res.status(404).json({ message: "File not found" });
    }
    // const filePathv = path.join(__dirname, 'mp3', title);
    const filePath = path.join(__dirname, "../..", music.url);
    console.log(filePath);

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Streaming support
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": "audio/mpeg",
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Full file download
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "audio/mpeg",
      };
      res.writeHead(200, head);
      res.on("error", (error) => {
        Logging.error(error);
      });

      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    Logging.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
const altStream = async (req: Request, res: Response) => {
  const { title } = req.params;
  const music = await Music.findOne({ title });
  if (!music) {
    return res.status(404).json({ message: "File not found" });
  }
  // Generate the URL for playing the specific MP3 file
  const streamUrl = `https://10ea-105-165-184-2.ngrok-free.app/stream/${music.url}`;

  const fileUrl = music.url;
  res.json({ streamUrl });
};

export default {
  createMusic,
  getMusic,
  getAllMusic,
  updateMusic,
  deleteMusic,
  stream,
  altStream,
};
