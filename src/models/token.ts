import mongoose, { Schema } from "mongoose";

export interface IToken {
  userId: string;
  token: string;
  created_at: Date;
}

export interface ITokenModel extends IToken, Document {}

const TokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  token: { type: String, required: true },
  created_at: {
    type: Schema.Types.Date,
    required: true,
    default: Date.now(),
    expires: 3600,
  },
});
export default mongoose.model<ITokenModel>("Token", TokenSchema);
