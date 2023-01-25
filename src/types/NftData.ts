import { AudioContent, ImageContent, MintInfo } from "./NusicSong";

export interface NftCollectionData {
  name?: string | null;
  description?: string | null;
  address?: string | null;
  imageContent: {
    posterUrl?: string | null;
    originalUrl?: string | null;
  };
  ownerAddress?: string | null;
  symbol?: string | null;
  contractType: "ERC721" | "ERC1155";
  tokenUri?: string | null;
}

export interface NftTokenData {
  name?: string | null;
  description?: string | null;
  tokenAddress: string;
  tokenId: string;
  tokenUri?: string | null;
  audioContent: AudioContent;
  imageContent: ImageContent;
  //   metadata: string;
  owner?: string | null;
  animationUrl?: string | null;
  mintInfo?: MintInfo;
  artist?: string | null;
  bpm?: string | null;
  key?: string | null;
  tokenUrlMimeType?: string | null;
  attributes: any[];
}
