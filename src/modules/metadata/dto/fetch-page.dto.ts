import { IsUrl } from "class-validator";

export class FetchPageDto {
  @IsUrl({ require_protocol: true, protocols: ["http", "https"] })
  url!: string;
}

export type LandingMetadataResponse = {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  faviconUrl: string | null;
};
