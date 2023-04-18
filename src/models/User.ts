import mongoose, { Document, Schema } from "mongoose";
import * as bcrypt from "bcrypt";

export interface IUser {
  name: string;
  phone: number;
  email: string;
  password: string;
  token: string;
}

export interface IUserModel extends IUser, Document {}

const UserSchema: Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    token: [{ type: Object }],
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    bcrypt.hash(this.password, 8, (err, hash) => {
      if (err) return next(err);

      this.password = hash;
      next();
    });
  }
});

UserSchema.methods.comparePassword = async function (password: string) {
  if (!password) throw new Error("Missing password, cannot compare. ");
  try {
    const result = await bcrypt.compare(password, this.password);
    return result;
  } catch (error: any) {
    console.log("Error while trying to compare password", error.message);
  }
};
UserSchema.statics.isThisEmailInUse = async function (email) {
  if (!email) throw new Error("Invalid email provided");
  try {
    const user = await this.findOne({ email });
    if (user) return false;

    return true;
  } catch (error: any) {
    console.log("error in the method", error.message);
    return false;
  }
};

export default mongoose.model<IUserModel>("User", UserSchema);
