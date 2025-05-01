import { IsNotEmpty, IsString } from "class-validator";

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}
