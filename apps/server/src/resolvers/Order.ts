import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { isAuth } from "../middlewares/isAuth";
import { Order } from "../entities";
import { MyContext } from "../create-app";
import { UserRole } from "../entities/User";
import { cartRepository, orderRepository, productRepository, userRepository } from "../repositories";

@Resolver()
export class OrderResolver {
  @Mutation(() => Order)
  @UseMiddleware(isAuth)
  async createOrderSuccess(
    @Arg("cartId", () => String) cartId: string,
    @Arg("status", () => String) status: string,
    @Ctx() { req }: MyContext
  ): Promise<Order> {
    if (!req.user.userId || req.user.role !== UserRole.USER) {
      throw Error("Invalid User");
    }
    if (!cartId) {
      throw Error("Invalid data");
    }
    const cart = await cartRepository.findOne({
      relations: {
        user: true,
        products: true
      },
      where: {
        id: cartId
      }
    });
    if (!cart) {
      throw Error("Invalid Cart Id");
    }
    const data: Record<string, any>[] = [];
    let productUpdates = cart.products.map(async (product, index) => {
      const productFromDb = await productRepository.findOne({
        where: {
          id: product.id
        }
      });
      if (!productFromDb) {
        throw Error("Invalid Cart Data");
      }
      const obj = {
        id: productFromDb.id,
        name: productFromDb.name,
        price: productFromDb.price,
        quantity: cart.quantity ? cart.quantity[index] : 1
      };
      data.push(obj);
      await productRepository.update(
        { id: productFromDb.id },
        { quantity: productFromDb.quantity - (cart.quantity ? cart.quantity[index] : 0) }
      );
    });
    await Promise.all(productUpdates);
    const user = await userRepository.findOne({ where: { id: req.user.userId } });
    if (!user) {
      throw Error("User not found");
    }
    await cartRepository.delete({ id: cartId });
    const order = orderRepository.create({
      user,
      status,
      data
    });
    await order.save();
    return order;
  }

  @Query(() => [Order])
  @UseMiddleware(isAuth)
  async getOrders(@Ctx() { req }: MyContext): Promise<Order[]> {
    if (!req.user.userId || req.user.role !== UserRole.USER) {
      throw Error("Invalid User");
    }
    const data = await orderRepository.find({
      relations: {
        user: true
      },
      where: {
        user: {
          id: req.user.userId
        }
      }
    });

    return data;
  }
}
