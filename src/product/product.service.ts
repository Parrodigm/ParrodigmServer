import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindManyOptions } from "typeorm";

import { Product } from "./entities/product.entity";

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>
  ) {}

  findAll(): Promise<Product[]> {
    return this.productRepository.find({ relations: ["images"] });
  }

  async findOne(id: number): Promise<Product> {
    const result = await this.productRepository.findOne({ where: { id }, relations: ["images"] });
    if (!result) {
      throw new BadRequestException(`Product with id ${id} not found`);
    }
    return result;
  }

  async findByQuery(options: string) {
    const result = await this.productRepository.find(JSON.parse(options) as FindManyOptions<Product>);
    for (const product of result) {
      if (!this.verifyQueryResult(product)) {
        throw new BadRequestException();
      }
    }
    return result;
  }

  private verifyQueryResult(product: Product): boolean {
    if (product.deletedAt !== null) {
      return false;
    }
    return true;
  }
}
