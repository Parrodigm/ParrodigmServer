import { Injectable } from "@nestjs/common";

import { ProductService } from "./product/product.service";

import { ElevenLabsClient } from "elevenlabs";
import OpenAI from "openai";

import { SYSTEM_PROMPT as CONVERSATION_SYSTEM_PROMPT } from "./utils/prompts/conversation";
import { SYSTEM_PROMPT as SQL_QUERY_SYSTEM_PROMPT } from "./utils/prompts/sql_query";

@Injectable()
export class AppService {
  private elevenLabsClient: ElevenLabsClient;
  private openAIClient: OpenAI;

  constructor(private readonly productService: ProductService) {
    this.elevenLabsClient = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });

    this.openAIClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  main(): string {
    return "Parrodigm API Server";
  }

  async getTranscript(file: Express.Multer.File) {
    const transcription = await this.elevenLabsClient.speechToText.convert({
      file: new Blob([file.buffer], { type: file.mimetype }),
      model_id: "scribe_v1",
      tag_audio_events: true,
      language_code: "eng",
      diarize: true,
    });

    return {
      text: transcription.text,
    };
  }

  async createConversation(messages: { role: "user" | "assistant" | "system"; content: string }[]) {
    const response = await this.openAIClient.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content: CONVERSATION_SYSTEM_PROMPT,
        },
        ...messages,
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    const responseData = JSON.parse(response.output_text) as { operation: "response"; text: string } | { operation: "query" };

    if (responseData.operation === "query") {
      return this.getProducts([...messages, { role: "assistant", content: response.output_text }]);
    }

    const audio = await this.elevenLabsClient.textToSpeech.convertWithTimestamps(process.env.ELEVENLABS_VOICE_ID as string, {
      text: responseData.text,
      model_id: process.env.ELEVENLABS_MODEL_ID as string,
      output_format: "mp3_44100_128",
    });

    return {
      type: "response",
      text: responseData.text,
      audio: audio.audio_base64,
    };
  }

  async getProducts(messages: { role: "user" | "assistant" | "system"; content: string }[]) {
    const response = await this.openAIClient.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content: SQL_QUERY_SYSTEM_PROMPT,
        },
        ...messages,
      ],
    });

    return {
      type: "products",
      query: response.output_text,
      products: await this.productService.findByQuery(response.output_text),
    };
  }
}
