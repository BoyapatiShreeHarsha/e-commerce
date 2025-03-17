import AppDataSource from "../postgres/data-source";
import { User, Product, Cart, Order } from "../entities";

const userRepository = AppDataSource.getRepository(User);
const productRepository = AppDataSource.getRepository(Product);
const cartRepository = AppDataSource.getRepository(Cart);
const orderRepository = AppDataSource.getRepository(Order);

export { userRepository, productRepository, cartRepository, orderRepository };
