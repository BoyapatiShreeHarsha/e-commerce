import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Cart } from "../entities";
import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "../create-app";
import { UserRole } from "../entities/User";
import { cartRepository, productRepository, userRepository } from "../repositories";
import Stripe from "stripe";

@Resolver()
export class CartResolver {
  @Mutation(() => Cart)
  @UseMiddleware(isAuth)
  async createCart(
    @Arg("productArr", () => [String])
    productArr: string[],
    @Arg("quantityArr", () => [Number])
    quantityArr: number[],
    @Ctx() { req }: MyContext
  ): Promise<Cart> {
    if (!req.user.userId || req.user.role !== UserRole.USER) {
      throw Error("Invalid User");
    }
    if (!productArr.length || productArr.length !== quantityArr.length) {
      throw Error("Invalid data");
    }
    const productPromises = productArr.map(async (productId, index) => {
      if (!productId || !quantityArr[index]) {
        throw Error("Invalid data");
      }
      const product = await productRepository.findOne({ where: { id: productId } });
      if (!product) {
        throw Error("Product not found");
      }
      if (product?.quantity < quantityArr[index]) {
        throw Error(`Number of ${product?.name} available are ${product?.quantity}`);
      }
      return product;
    });
    const products = await Promise.all(productPromises);
    const user = await userRepository.findOne({ where: { id: req.user.userId } });
    if (!user) {
      throw Error("User not found");
    }
    const cart = cartRepository.create({ user, products, quantity: quantityArr });
    await cart.save();
    return cart;
  }

  @Query(() => [Cart])
  @UseMiddleware(isAuth)
  async getCarts(@Ctx() { req }: MyContext): Promise<Cart[]> {
    if (!req.user.userId || req.user.role !== UserRole.USER) {
      throw Error("Invalid User");
    }
    const data = await cartRepository.find({
      relations: {
        user: true,
        products: true
      },
      where: {
        user: {
          id: req.user.userId
        }
      }
    });

    return data;
  }

  @Mutation(() => Cart)
  @UseMiddleware(isAuth)
  async updateCart(
    @Arg("cartId", () => String)
    cartId: string,
    @Arg("productArr", () => [String])
    productArr: string[],
    @Arg("quantityArr", () => [Number])
    quantityArr: number[],
    @Ctx() { req }: MyContext
  ): Promise<Cart> {
    if (!req.user.userId || req.user.role !== UserRole.USER) {
      throw Error("Invalid User");
    }
    if (!productArr.length || productArr.length !== quantityArr.length) {
      throw Error("Inavlid data");
    }

    const productPromises = productArr.map(async (productId, index) => {
      if (!productId || !quantityArr[index]) {
        throw Error("Invalid data");
      }
      const product = await productRepository.findOne({ where: { id: productId } });
      if (!product) {
        throw Error("Product not found");
      }
      if (product?.quantity < quantityArr[index]) {
        throw Error(`Number of ${product?.name} available are ${product?.quantity}`);
      }
      return product;
    });
    const products = await Promise.all(productPromises);
    const cart = await cartRepository.findOne({ where: { id: cartId } });
    if (!cart) {
      throw new Error("Invalid cart");
    }
    cart.products = products;
    cart.quantity = quantityArr;
    cart.save();
    return cart;
  }

  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async deleteCart(@Arg("cartId", () => String) cartId: string, @Ctx() { req }: MyContext): Promise<String> {
    if (!req.user.userId || req.user.role !== UserRole.USER) {
      throw Error("Invalid User");
    }
    if (!cartId) {
      throw Error("Invalid data");
    }
    const cart = await cartRepository.findOne({
      relations: {
        user: true
      },
      where: {
        id: cartId,
        user: {
          id: req.user.userId
        }
      }
    });
    if (!cart) {
      throw Error("Invalid Cart Id");
    }
    await cartRepository.delete({ id: cartId });
    return "Successfully Deleted";
  }

  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async checkout(@Arg("cartId", () => String) cartId: string, @Ctx() { req }: MyContext): Promise<String> {
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
    cart.products.forEach((product, index) => {
      if (cart.quantity && product.quantity < cart.quantity[index]) {
        throw Error(`Number of ${product.name} available are ${product.quantity}`);
      }
    });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cart.products.map((product, index) => {
        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: product.name
            },
            unit_amount: Math.round(product.price * 100)
          },
          quantity: cart.quantity ? cart.quantity[index] : 1
        };
      }),
      mode: "payment",
      success_url: `${process.env.ORIGIN}/success/${cartId}`,
      cancel_url: `${process.env.ORIGIN}/cancel`
    });
    return session.url || "";
  }
}
