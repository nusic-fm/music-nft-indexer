import { AudioContent, ImageContent, MintInfo } from "./NusicSong";

export interface NftCollectionData {
  name?: string | null;
  description?: string | null;
  address?: string | null;
  ownerAddress?: string | null;
  symbol?: string | null;
  contractType: "ERC721" | "ERC1155";
  tokenUri?: string | null;
}

export interface NftTokenData {
  name: string | null;
  description: string | null;
  tokenAddress: string;
  tokenId: string;
  tokenUri: string | null;
  // audioContent: AudioContent;
  // imageContent: ImageContent;
  //   metadata: string;
  owner: string | null;
  animationUrl: string | null;
  mintInfo: MintInfo;
  tokenUrlMimeType: string | null;
  attributes: any[];
  original: {
    imageUrl: string;
    animationUrl: string;
  };
  imageSize: number | null;
  imageMimeType: string | null;

  audioSize: number | null;
  audioMimeType: string | null;

  artist?: string | null;
  bpm?: string | null;
  key?: string | null;
  genre?: string | null;
}
