import { NftCollectionData, NftTokenData } from "../types/NftData";
import { NftSong } from "../types/NftSong";
import { EditionType, NusicSong } from "../types/NusicSong";
import { IZoraData } from "../types/Zora";
import { createUrlFromCid, getDataFromCid, getFileFormatFromUrl } from "./nft";

export const getNftSongData = (token: IZoraData): NftSong => ({
  name: token.name,
  description: token.description,
  tokenAddress: token.collectionAddress,
  tokenId: token.tokenId,
  owner: token.owner,
  audioContent: {
    originalUrl: "",
    streamUrl: "",
  },
  imageContent: {
    originalUrl: "",
    posterUrl: "",
  },
  nativeAudioUrl: false,
  nativeImageUrl: false,

  //
  artist: (token.metadata as any)?.artist || "",
  bpm: (token.metadata as any)?.bpm || "",
  key: (token.metadata as any)?.key || "",
  tokenIds: [token.tokenId],
});

export const getNusicNftModel = (token: IZoraData): NftCollectionData => ({
  name: token.tokenContract?.name ?? token.name ?? null,
  description: token.tokenContract?.description ?? token.description ?? null,
  symbol: token.tokenContract?.symbol ?? null,
  tokenUri: token.tokenUrl ?? null,
  contractType: (token as any).tokenStandard ?? null,
  ownerAddress: token.owner ?? null,
});

export const getNusicTokenData = (token: any): NftTokenData => ({
  name: token.name,
  description: token.description,
  tokenAddress: token.collectionAddress,
  tokenId: token.tokenId,
  tokenUri: token.tokenUrl ?? null,
  owner: token.owner,
  mintInfo: {
    originatorAddress: token.mintInfo?.originatorAddress,
    toAddress: token.mintInfo?.toAddress,
  },
  animationUrl: token.metadata?.animation_url ?? null,
  tokenUrlMimeType: token.tokenUrlMimeType,
  attributes:
    (token.attributes || token.metadata?.attributes)?.map((a: any) => ({
      trait_type: a.trait_type,
      value: a.value,
    })) ?? [],
  original: {
    imageUrl: createUrlFromCid(token.metadata?.animation_url) ?? null,
    animationUrl: createUrlFromCid(token.metadata?.image) ?? null,
  },
  imageSize: token.image?.size ?? null,
  imageMimeType: token.image?.mimeType ?? null,
  audioSize: token.content?.size ?? null,
  audioMimeType: token.content?.mimeType ?? null,
  // Other data
  artist: token.metadata?.artist ?? null,
  bpm: token.metadata?.bpm ?? null,
  key: token.metadata?.key ?? null,
  genre: token.metadata?.genre ?? null,
});

export const getNusicSongModel = (
  token: any,
  editionType: EditionType
): NusicSong => ({
  name: token.name,
  description: token.description,
  collectionName: token.tokenContract?.name,
  collectionDescription: token.tokenContract?.description,
  symbol: token.tokenContract?.symbol,
  tokenAddress: token.collectionAddress,
  tokenId: token.tokenId,
  tokenUri: token.tokenUrl ?? null,
  contractType: (token as any).tokenStandard ?? null,
  owner: token.owner,
  editionType,
  mintInfo: {
    originatorAddress: token.mintInfo?.originatorAddress,
    toAddress: token.mintInfo?.toAddress,
  },
  animationUrl: token.metadata?.animation_url ?? null,
  audioContent: {
    tokenUrl: "",
    originalUrl: "",
    streamUrl: "",
    animationUrl: "",
  },
  imageContent: {
    tokenUrl: "",
    originalUrl: "",
    posterUrl: "",
    thumbnailUrl: "",
    streamUrl: "",
  },
  //
  artist: token.metadata?.artist ?? null,
  bpm: token.metadata?.bpm ?? null,
  key: token.metadata?.key ?? null,
  tokenUrlMimeType: token.tokenUrlMimeType,
});

export const getAudioDataFromNft = async (tokenUri: string) => {
  const response = await getDataFromCid(tokenUri);
  if (response) {
    console.log("Got Response", response.data.name);
    const tokenMetadata = response.data;
    let obj = {
      artworkUrl: "",
      audioFileUrl: "",
      name: response.data.name,
      format: "unknown",
      tokenUri: response.data.token_uri,
    };

    if (tokenMetadata.animation_url) {
      const url = createUrlFromCid(tokenMetadata.animation_url);
      if (url) {
        obj.audioFileUrl = url;
        const format = await getFileFormatFromUrl(url);
        obj.format = format;
      }
    }
    if (tokenMetadata.image) {
      const url = createUrlFromCid(tokenMetadata.image);
      if (url) {
        obj.artworkUrl = url;
        if (obj.audioFileUrl.length === 0) {
          const format = await getFileFormatFromUrl(url);
          if (format === "audio" || format === "video") {
            obj.audioFileUrl = url;
          }
          obj.format = format;
        }
      }
    }
    console.log("Successful for: ", obj.name);
    return obj;
  } else {
    console.log("Invalid tokenUri");
    throw "Invalid tokenUri, unable to get response";
  }
};

// export default getAudioDataFromNft;
export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
