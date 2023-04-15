import mongoose, { Document, Schema } from "mongoose";

export interface IArtist {
  name: string;
}

export interface IArtistModel extends IArtist, Document {}
const ArtistSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
  },
  { versionKey: false }
);
export default mongoose.model<IArtistModel>("Artist", ArtistSchema);
