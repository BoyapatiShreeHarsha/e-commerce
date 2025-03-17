import express, { Application, Request, Response, NextFunction } from "express";
import { ApolloServer, BaseContext } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import { buildSchema } from "type-graphql";
import * as http from "http";
import AppDataSource from "./postgres/data-source";
import cookieParser from "cookie-parser";
import { UserRole } from "./entities/User";
import { UserResolver } from "./resolvers/Users";
import { ProductResolver } from "./resolvers/Products";
import AnyScalar from "./graphql-any-type";
import { CartResolver } from "./resolvers/Carts";
import { OrderResolver } from "./resolvers/Order";

const corsOptions: cors.CorsOptions = {
  origin: process.env.ORIGIN,
  optionsSuccessStatus: 200,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"]
};
interface ReqUser {
  userId: string;
  userEmail: string;
  role: UserRole;
}
export interface MyContext extends BaseContext {
  req: Request & { log: (value: string) => void; user: ReqUser };
  res: Response;
}
export async function createApp() {
  const app: Application = express();
  const httpServer = http.createServer(app);
  const server = new ApolloServer<MyContext>({
    schema: await buildSchema({
      resolvers: [UserResolver, ProductResolver, CartResolver, OrderResolver],
      scalarsMap: [{ type: Object, scalar: AnyScalar }], //need to see why we used it.
      validate: false
    }),
    introspection: true, //need to see why
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
  });
  await AppDataSource.initialize();
  console.log("=====Connected to the database=====");

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.set("Access-Control-Allow-Origin", process.env.ORIGIN);
    res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("X-Frame-Options", "DENY");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    next();
  });

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.raw({ type: "application/octet-stream", limit: "100mb" }));
  app.use(cookieParser());

  await server.start();
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(corsOptions),
    express.json({ limit: "50mb" }),
    expressMiddleware(server, {
      context: async ({ req, res }): Promise<MyContext> => {
        const extendedReq = req as MyContext["req"];
        extendedReq.log = (value: string) => console.log(value);
        extendedReq.user = { userId: "", userEmail: "", role: "user" as UserRole };

        return { req: extendedReq, res };
      }
    })
  );

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.log("Error in the global catch==========>>>>");
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    });
  });

  return app;
}
