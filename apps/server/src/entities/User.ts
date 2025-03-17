import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToMany
} from "typeorm";
import { Cart } from "./Cart";
import { Order } from "./Order";

export enum UserRole {
  ADMIN = "admin",
  USER = "user"
}

@Entity({ name: "users" })
@ObjectType()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id!: string;

  @Column({ type: "varchar", length: 255 })
  @Field(() => String)
  username!: string;

  @Column({ unique: true, type: "varchar", length: 255 })
  @Field(() => String)
  email!: string;

  @Column({ type: "varchar" })
  @Field(() => String)
  hashed_password!: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  @Field(() => String)
  role!: string;

  @Field(() => [Cart])
  @OneToMany(() => Cart, cart => cart.user)
  carts!: Cart[];

  @Field(() => [Order])
  @OneToMany(() => Order, order => order.user)
  orders!: Order[];

  @CreateDateColumn()
  @Field(() => String)
  created_on!: Date;

  @UpdateDateColumn()
  @Field(() => String)
  updated_on!: Date;
}
