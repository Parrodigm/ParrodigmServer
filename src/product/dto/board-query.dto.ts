import { Transform } from "class-transformer";
import { IsOptional, IsNumber } from "class-validator";

export class FindProductQueryDto {
  @Transform(({ value }) => (value === undefined || value === "" ? undefined : Number(value)))
  @IsOptional()
  @IsNumber()
  id?: number;
}
