export interface MintInfo {
  originatorAddress?: string | null;
  toAddress?: string | null;
}
export interface AudioContent {
  tokenUrl?: string | null;
  originalUrl?: string | null;
  streamUrl?: string | null;
  animationUrl?: string | null;
}
export interface ImageContent {
  tokenUrl?: string | null;
  originalUrl?: string | null;
  streamUrl?: string | null;
  posterUrl?: string | null;
  thumbnailUrl?: string | null;
}
export type EditionType = "Single" | "Multiple" | "Unknown";

export interface NusicSong {
  name?: string | null;
  description?: string | null;
  collectionName?: string | null;
  collectionDescription?: string | null;
  symbol?: string | null;
  tokenAddress: string;
  tokenId: string;
  contractType: "ERC721" | "ERC1155";
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
  editionType: EditionType;
}
