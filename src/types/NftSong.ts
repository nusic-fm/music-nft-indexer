import { AudioContent, EditionType, ImageContent, MintInfo } from "./NusicSong";

export interface NftSong {
  name?: string | null;
  description?: string | null;
  symbol?: string | null;
  tokenAddress: string;
  tokenId: string;
  audioContent: AudioContent;
  imageContent: ImageContent;
  owner?: string | null;
  artist?: string | null;
  bpm?: string | null;
  key?: string | null;
  tokenIds: string[];
}
