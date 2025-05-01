import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, VersionColumn, OneToMany, JoinColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity()
export class ProductManufacturer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, unique: true, name: "display_name" })
  displayName: string;

  @OneToMany(() => Product, (product: Product) => product.manufacturer)
  @JoinColumn({ name: "product_id" })
  products: Product[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;

  @VersionColumn()
  version: number;
}
