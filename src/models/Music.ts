import mongoose, { Schema } from "mongoose";
import { Document } from "mongoose";
export interface IMusic {
  title: string;
  artist: string;
  url: string;
}

export interface IMusicModel extends IMusic, Document {}

const MusicSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    url: String,
    artist: { type: Schema.Types.ObjectId, required: true, ref: "Artist" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IMusicModel>("Music", MusicSchema);
