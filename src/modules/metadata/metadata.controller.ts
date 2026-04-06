import { Body, Controller, Post } from "@nestjs/common";
import type { LandingMetadataResponse } from "./dto/fetch-page.dto";
import { FetchPageDto } from "./dto/fetch-page.dto";
import { MetadataService } from "./metadata.service";

@Controller("metadata")
export class MetadataController {
  constructor(private readonly metadata: MetadataService) {}

  @Post("fetch-page")
  fetchPage(@Body() body: FetchPageDto): Promise<LandingMetadataResponse> {
    return this.metadata.fetchLandingMetadata(body.url);
  }
}
