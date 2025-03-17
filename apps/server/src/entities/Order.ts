import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { User } from "./User";
import AnyScalar from "../graphql-any-type";

export enum OrderStatus {
  SUCCESS = "success",
  CANCEL = "cancel"
}

@Entity({ name: "orders" })
@ObjectType()
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id!: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.carts, { onDelete: "CASCADE" })
  user!: User;

  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.CANCEL })
  @Field(() => String)
  status!: string;

  @Column({ type: "jsonb", default: {} })
  @Field(() => AnyScalar)
  data!: object;

  @CreateDateColumn()
  @Field(() => String)
  created_on!: Date;

  @UpdateDateColumn()
  @Field(() => String)
  updated_on!: Date;
}
