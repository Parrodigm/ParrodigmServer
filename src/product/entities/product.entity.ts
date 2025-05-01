import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  VersionColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ProductManufacturer } from "./product-manufacturer.entity";
import { ProductImage } from "./product-image.entity";
import { ProductColor } from "./product-color.entity";
import { ProductMaterial } from "./product-material.entity";
import { CategoryEnum, TypeEnum, SizeEnum, SeasonEnum } from "./enums/product.enum";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500, name: "display_name" })
  displayName: string;

  @Column({ type: "text" })
  description: string;

  @ManyToOne(() => ProductManufacturer, (manufacturer: ProductManufacturer) => manufacturer.products, { eager: true, nullable: true })
  @JoinColumn({ name: "manufacturer_id" })
  manufacturer: ProductManufacturer;

  @Column({ type: "float", default: 0 })
  price: number;

  @Column({ type: "float", default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviews: number;

  @Column({ type: "enum", enum: CategoryEnum })
  category: CategoryEnum;

  @Column({ type: "enum", enum: TypeEnum })
  type: TypeEnum;

  @OneToMany(() => ProductColor, (color: ProductColor) => color.product, { eager: true, cascade: true })
  colors: ProductColor[];

  @Column({ type: "enum", enum: SizeEnum, nullable: true })
  size: SizeEnum;

  @Column({ type: "numrange", nullable: true, name: "weight_range" })
  weightRange: number[];

  @Column({ type: "enum", enum: SeasonEnum, nullable: true })
  season: SeasonEnum;

  @OneToMany(() => ProductMaterial, (material: ProductMaterial) => material.product, { eager: true, cascade: true })
  materials: ProductMaterial[];

  @Column({ type: "text", nullable: true })
  instructions: string;

  @OneToMany(() => ProductImage, (image: ProductImage) => image.product, { eager: true, cascade: true })
  images: ProductImage[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;

  @VersionColumn()
  version: number;
}
