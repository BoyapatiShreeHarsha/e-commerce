import { Field, ObjectType } from "type-graphql";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity } from "typeorm";
import AnyScalar from "../graphql-any-type";

@Entity({ name: "products" })
@ObjectType()
export class Product extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  @Field(() => String)
  name!: string;

  @Column({ type: "float", default: 0 })
  @Field(() => Number)
  price!: number;

  @Column({ type: "float", default: 1 })
  @Field(() => Number)
  quantity!: number;

  @Column({ type: "text", array: true, nullable: true })
  @Field(() => [String], { nullable: true })
  images?: string[];

  @Column({ type: "jsonb", default: {} })
  @Field(() => AnyScalar)
  features!: object;

  @Column({ type: "jsonb", default: {} })
  @Field(() => AnyScalar)
  others!: object;

  @CreateDateColumn()
  @Field(() => String)
  created_on!: Date;

  @UpdateDateColumn()
  @Field(() => String)
  updated_on!: Date;
}
