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
  imageContent: {
    originalUrl: "",
    posterUrl: "",
  },
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
  attributes:
    token.metadata?.attribute?.map((attribute: any) => ({
      trait_type: attribute.trait_type,
      value: attribute.value,
    })) ?? [],
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