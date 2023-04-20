import Joi, { ObjectSchema } from "joi";
import Logging from "../library/Logging";
import { Request, Response, NextFunction } from "express";
import { IArtist } from "../models/Artist";
import { IMusic } from "../models/Music";
import { IUser } from "../models/User";

export const ValidateSchema = (schema: ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validateAsync(req.body);
      next();
    } catch (error) {
      Logging.error(error);
      return res.status(422).json({ error });
    }
  };
};

export const Schemas = {
  artist: {
    create: Joi.object<IArtist>({
      name: Joi.string().required(),
    }),
    update: Joi.object<IArtist>({
      name: Joi.string().required(),
    }),
  },
  music: {
    create: Joi.object<IMusic>({
      artist: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      title: Joi.string().required(),
    }),
    update: Joi.object<IMusic>({
      artist: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required(),
      title: Joi.string().required(),
    }),
  },
  user: {
    create: Joi.object<IUser>({
      name: Joi.string().required(),
      email: Joi.string().required().email(),
      phone: Joi.string().required(),
      password: Joi.string().required(),
    }),
  },
};
