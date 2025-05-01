import { Controller, Get, Query } from "@nestjs/common";
import { ProductService } from "./product.service";
import { FindProductQueryDto } from "./dto/board-query.dto";

@Controller("product")
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  find(@Query() query: FindProductQueryDto) {
    if (query.id === undefined) {
      return this.productService.findAll();
    }
    return this.productService.findOne(query.id);
  }
}
