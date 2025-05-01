import { Controller, Get, Post, UploadedFile, UseInterceptors, Body, HttpCode } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AppService } from "./app.service";
import { ConversationDto } from "./dto/conversation.dto";
import { QueryDto } from "./dto/query.dto";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  main(): string {
    return this.appService.main();
  }

  @Post("transcript")
  @HttpCode(200)
  @UseInterceptors(FileInterceptor("audio"))
  async getTranscript(@UploadedFile() file: Express.Multer.File) {
    return this.appService.getTranscript(file);
  }

  @Post("conversation")
  @HttpCode(200)
  async createConversation(@Body() body: ConversationDto) {
    return this.appService.createConversation(body.messages);
  }

  @Post("query")
  @HttpCode(200)
  async getProducts(@Body() body: QueryDto) {
    return this.appService.getProducts([
      {
        role: "user",
        content: body.query,
      },
    ]);
  }
}
