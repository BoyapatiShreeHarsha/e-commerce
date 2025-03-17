import { DataSource } from "typeorm";
import { Product, User, Cart, Order } from "../entities";

const requiredEnvVars = ["DB_HOST", "DB_PORT", "DB_USER", "DB_PASS", "DB_NAME"];

function checkPostgresCredentials(config: string | undefined, requiredEnvVars: string[]) {
  if (!config) {
    return;
  }
  let obj = JSON.parse(config);
  for (let envVar of requiredEnvVars) {
    if (!obj[envVar]) {
      throw new Error(`Missing environment variable ${envVar}`);
    }
  }
}

const config = process.env.POSTGRES_CONFIG;
if (!config) {
  throw new Error("Missing environment variable POSTGRES_CONFIG");
}
checkPostgresCredentials(config, requiredEnvVars);
const obj = JSON.parse(config);
const AppDataSource = new DataSource({
  type: "postgres",
  host: obj.DB_HOST,
  port: parseInt(obj.DB_PORT),
  username: obj.DB_USER,
  password: obj.DB_PASS,
  database: obj.DB_NAME,
  entities: [User, Product, Cart, Order],
  synchronize: true
});

export default AppDataSource;
