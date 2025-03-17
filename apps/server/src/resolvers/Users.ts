import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Cart, User } from "../entities";
import { cartRepository, userRepository } from "../repositories";
import { hashPassword } from "../utils";
import * as jwt from "jsonwebtoken";
import { MyContext } from "../create-app";
import { isAuth } from "../middlewares/isAuth";
import { UserRole } from "../entities/User";

@Resolver()
export class UserResolver {
  @Query(() => [User])
  @UseMiddleware(isAuth)
  async getUsers(@Ctx() { req }: MyContext): Promise<User[]> {
    if (req.user?.role && req.user.role !== UserRole.ADMIN) {
      throw Error("Only Admin can view all users");
    }
    let user = await userRepository.find({ where: {} });
    return user;
  }

  @Query(() => String)
  async userLogin(
    @Arg("email", () => String)
    email: string,
    @Arg("password", () => String)
    password: string,
    @Ctx() { res }: MyContext
  ): Promise<string> {
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error("User not found");
    }
    const hashed_password = hashPassword(password);
    if (user.hashed_password !== hashed_password) {
      throw new Error("Invalid password");
    }
    let token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "");
    res.cookie("token", token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 });
    return "Login successful";
  }

  @Mutation(() => User)
  async createUser(
    @Arg("email", () => String)
    email: string,
    @Arg("password", () => String)
    password: string,
    @Arg("username", () => String)
    username: string,
    @Arg("role", () => String)
    role: string
  ): Promise<User> {
    const hashed_password = hashPassword(password);
    let payload: { email: string; hashed_password: string; username: string; role?: string } = {
      email,
      hashed_password,
      username,
      role
    };
    if (!payload.role) delete payload.role;
    const user = userRepository.create(payload);
    await user.save();
    return user;
  }

  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async deleteUser(@Arg("id", () => String) userId: string, @Ctx() { req }: MyContext): Promise<String> {
    if (!req.user.userId) {
      throw Error("Invalid User");
    }
    if (req.user.role === UserRole.USER && req.user.userId !== userId) {
      throw Error("You don't have the permission to do this");
    }
    await cartRepository.createQueryBuilder().delete().from(Cart).where("userId = :userId", { userId }).execute();

    await userRepository.delete({ id: userId });
    return "Successfully Deleted";
  }
}
