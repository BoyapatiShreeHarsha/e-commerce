import { MiddlewareFn } from "type-graphql";
import { MyContext } from "../create-app";
import * as jwt from "jsonwebtoken";
import { userRepository } from "../repositories";
import { UserRole } from "../entities/User";

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const token = context.req.cookies.token;
  if (!token) {
    throw new Error("Not authenticated");
  }
  const payload = jwt.verify(token, process.env.JWT_SECRET || "") as { id: string };
  if (!payload) {
    throw new Error("Not authenticated");
  }
  const user = await userRepository.findOne({ where: { id: payload.id } });
  if (!user) throw new Error("Not authenticated");

  context.req.user = {
    userEmail: user.email,
    userId: user.id,
    role: user.role as UserRole
  };

  context.req.log = (value: string) => {
    console.log("User Logs:", user.email, "=====>", value);
  };
  return next();
};
