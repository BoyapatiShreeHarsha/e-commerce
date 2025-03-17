import { Arg, Ctx, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Product } from "../entities";
import { cartRepository, productRepository } from "../repositories";
import { isAuth } from "../middlewares/isAuth";
import { MyContext } from "../create-app";
import { UserRole } from "../entities/User";
import AnyScalar from "../graphql-any-type";
import { handleObjectUpdate } from "../utils";

@Resolver()
export class ProductResolver {
  @Mutation(() => Product)
  @UseMiddleware(isAuth)
  async createProduct(
    @Arg("name", () => String)
    name: string,
    @Arg("price", () => Number)
    price: number,
    @Arg("quantity", () => Number)
    quantity: number,
    @Arg("images", () => [String], { nullable: true })
    images: string[] | undefined,
    @Arg("features", () => AnyScalar, { nullable: true })
    features: object | undefined,
    @Arg("others", () => AnyScalar, { nullable: true })
    others: object | undefined,
    @Ctx() { req }: MyContext
  ): Promise<Product> {
    if (req.user?.role && req.user.role !== UserRole.ADMIN) {
      throw Error("Only Admin can add products");
    }
    let payload = {
      name,
      price,
      images,
      quantity,
      features,
      others
    };
    const product = productRepository.create(payload);
    await product.save();
    return product;
  }

  @Query(() => [Product])
  @UseMiddleware(isAuth)
  async getProducts(
    @Arg("skip", () => Number)
    skip: number,
    @Arg("limit", () => Number)
    limit: number,
    @Ctx() { req }: MyContext
  ): Promise<Product[]> {
    if (!req.user.userId) {
      throw Error("Invalid User");
    }
    return productRepository.find({ skip, take: limit });
  }

  @Mutation(() => Product, { nullable: true })
  @UseMiddleware(isAuth)
  async updateProduct(
    @Arg("id", () => String)
    id: string,
    @Arg("name", () => String, { nullable: true })
    name: string | undefined,
    @Arg("price", () => Number, { nullable: true })
    price: number | undefined,
    @Arg("quantity", () => Number, { nullable: true })
    quantity: number | undefined,
    @Arg("images", () => [String], { nullable: true })
    images: string[] | undefined,
    @Arg("features", () => AnyScalar, { nullable: true })
    features: object | undefined,
    @Arg("others", () => AnyScalar, { nullable: true })
    others: object | undefined,
    @Ctx() { req }: MyContext
  ): Promise<Product | null> {
    if (req.user?.role && req.user.role !== UserRole.ADMIN) {
      throw Error("Only Admin can update products");
    }
    let payload: Record<string, any> = {
      name,
      price,
      images,
      quantity,
      features,
      others
    };
    payload = handleObjectUpdate(payload);
    await productRepository.update({ id }, payload);
    const product = await productRepository.findOne({ where: { id } });
    return product;
  }

  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async deleteProduct(
    @Arg("id", () => String)
    id: string,
    @Ctx() { req }: MyContext
  ): Promise<string> {
    if (req.user?.role && req.user.role !== UserRole.ADMIN) {
      throw Error("Only Admin can delete products");
    }
    const carts = await cartRepository.find({
      select: {
        id: true
      },
      relations: {
        products: true
      },
      where: {
        products: {
          id: id
        }
      }
    });

    const cartsPromise = carts.map(async cartObj => {
      const cart = await cartRepository.findOne({
        relations: {
          products: true
        },
        where: { id: cartObj.id }
      });
      if (!cart) {
        return;
      }
      let index = 0;
      cart.products = cart.products.filter((product, i) => {
        if (product.id === id) {
          index = i;
        }
        return product.id !== id;
      });
      cart.quantity = cart.quantity?.filter((_quant, i) => {
        return i !== index;
      });
      if (cart.products.length === 0) {
        await cart.remove();
      } else {
        await cart.save();
      }
    });
    await Promise.all(cartsPromise);
    await productRepository.delete({ id });
    return "Product Deleted successfully";
  }
}
