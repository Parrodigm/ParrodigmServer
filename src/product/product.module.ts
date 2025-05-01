import { Module } from "@nestjs/common";
import { ProductService } from "./product.service";
import { ProductController } from "./product.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./entities/product.entity";
import { ProductManufacturer } from "./entities/product-manufacturer.entity";
import { ProductColor } from "./entities/product-color.entity";
import { ProductMaterial } from "./entities/product-material.entity";
import { ProductImage } from "./entities/product-image.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductManufacturer, ProductColor, ProductMaterial, ProductImage])],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
