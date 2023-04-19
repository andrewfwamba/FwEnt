import mongoose, { Document, Model, Schema, model } from "mongoose";
import * as bcrypt from "bcrypt";

export interface IUser {
  name: string;
  phone: number;
  email: string;
  password: string;
  token: string;
}

export interface IUserModel extends IUser, Document {
  comparePassword(password: string): Promise<boolean>;
}

export interface IUserModelStatic extends Model<IUserModel> {
  isThisEmailInUse(email: string): Promise<boolean>;
}

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

UserSchema.pre<IUserModel>("save", async function (next) {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(8);
      const hash = await bcrypt.hash(this.password, salt);
      this.password = hash;
      next();
    } catch (err: any) {
      return next(err);
    }
  }
});

UserSchema.methods.comparePassword = async function (
  this: IUserModel,
  password: string
) {
  if (!password) throw new Error("Missing password, cannot compare. ");
  try {
    const result = await bcrypt.compare(password, this.password);
    return result;
  } catch (error: any) {
    console.log("Error while trying to compare password", error.message);
    return false;
  }
};

UserSchema.statics.isThisEmailInUse = async function (email: string) {
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

// UserSchema.statics.isThisEmailInUse = async function (
//   this: IUserModelStatic,
//   email: string
// ) {
//   if (!email) throw new Error("Invalid email provided");
//   try {
//     const user = await this.findOne({ email });
//     if (user) return false;

//     return true;
//   } catch (error: any) {
//     console.log("error in the method", error.message);
//     return false;
//   }
// };

// const UserModel: IUserModelStatic = mongoose.model<
//   IUserModel,
//   IUserModelStatic
// >("User", UserSchema);

// export default UserModel;
const UserModel: IUserModelStatic = <IUserModelStatic>(
  model<IUserModel>("User", UserSchema)
);

export default UserModel;
