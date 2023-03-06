import { AudioContent, EditionType, ImageContent, MintInfo } from "./NusicSong";

export interface NftSong {
  name?: string | null;
  collectionName?: string | null;
  description?: string | null;
  symbol?: string | null;
  tokenAddress: string;
  tokenId: string;
  nativeContent: {
    audio: AudioContent;
    image: ImageContent;
  };
  nativeAudioUrl: boolean;
  nativeImageUrl: boolean;
  owner?: string | null;
  artist?: string | null;
  bpm?: string | null;
  key?: string | null;
  tokenIds: string[];
  blockNo: number;
}
