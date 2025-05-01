import { IsArray, IsEnum, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class MessageDto {
  @IsEnum(["user", "assistant"])
  @IsNotEmpty()
  role: "user" | "assistant";

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class ConversationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];
}
