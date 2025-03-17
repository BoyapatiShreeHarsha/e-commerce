import { BaseEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";
import { Field, ObjectType } from "type-graphql";
import { Product } from "./Product";

@Entity({ name: "carts" })
@ObjectType()
export class Cart extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id!: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.carts, { onDelete: "CASCADE" })
  user!: User;

  @Field(() => [Product])
  @ManyToMany(() => Product)
  @JoinTable()
  products!: Product[];

  @Column({ type: "text", array: true, nullable: true })
  @Field(() => [Number], { nullable: true })
  quantity?: number[];
}
