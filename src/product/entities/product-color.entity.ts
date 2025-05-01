import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity()
export class ProductColor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  major: string;

  @Column({ length: 255, nullable: true })
  sub: string;

  @Column({ type: "int", nullable: true })
  r: number;

  @Column({ type: "int", nullable: true })
  g: number;

  @Column({ type: "int", nullable: true })
  b: number;

  @ManyToOne(() => Product, (product) => product.colors, { onDelete: "CASCADE" })
  @JoinColumn({ name: "product_id" })
  product: Product;
}
