// import Moralis from "moralis";
import { RedisClientType } from "@redis/client";
import { ZDK, ZDKNetwork, ZDKChain } from "@zoralabs/zdk";
// import { MediaType } from "@zoralabs/zdk/dist/queries/queries-sdk";
// import { tokensQuery } from "./helpers/queries";
import axios from "axios";
// import path from "path";
// import { MediaType } from "@zoralabs/zdk/dist/queries/queries-sdk";
import fetchAndUpload from "./services/storage";
import { createUrlFromCid } from "./helpers/nft";
// import { EditionType, NusicSong } from "./types/NusicSong";
import { addSongToDb, updateSongToDb } from "./services/db/songs.service";
import { getNftTransfersFromBlock } from "./helpers/moralis";
import { getMusicNFTMetadata } from "./helpers/zora";
import { getNftSongData, getNusicNftModel, getNusicTokenData } from "./helpers";
import {
  addNftToDb,
  addTokenToNftCollection,
} from "./services/db/nfts.service";
import { IZoraData } from "./types/Zora";
const redis = require("redis");

const networkInfo = {
  network: ZDKNetwork.Ethereum,
  chain: ZDKChain.Mainnet,
};
const API_ENDPOINT = "https://api.zora.co/graphql";
const args = {
  endPoint: API_ENDPOINT,
  networks: [networkInfo],
  // apiKey: process.env.API_KEY
};

const REDIS_KEYS = {
  noOfMusicNfts: "noOfMusicNfts",
  currentBlock: "currentBlock",
  tokenUri: "tokenUri",
  tokenId: "tokenId",
  songId: "songId",
};

export class MoralisIndexer {
  //15946075
  public startBlock: number = 15945404;
  public latestBlock: number = 15945404;
  // public blocks = [
  //   11565108, 16488663, 16494452, 13916084, 16503323, 16157168, 16341506,
  //   15440562, 16503193, 16322023,
  // ];
  // public i = this.blocks.length;
  // NFTs: 16411983
  // last stop: 16411995 -> 16411573 -> 16411543
  public musicNFTsLength: number = 0;
  public redisClient: RedisClientType = redis.createClient();
  public zoraClient: ZDK;

  constructor(latestBlock?: number) {
    if (latestBlock) {
      this.latestBlock = latestBlock;
    }
    this.zoraClient = new ZDK(args);
  }

  async init() {
    // await Moralis.start({
    //   apiKey: process.env.MORALIS_API_KEY,
    //   // ...and any other configuration
    // });
    await this.redisClient.connect();
  }
  async getMusicNftsCount(): Promise<string | null> {
    return this.redisClient.get(REDIS_KEYS.noOfMusicNfts);
  }
  async getCurrentBlock(): Promise<string | null> {
    return this.redisClient.get(REDIS_KEYS.currentBlock);
  }

  async identifyNewNftsFromRedis(
    tokens: { token_address: string; token_id: string }[]
  ) {
    const newTokens: { address: string; tokenId: string }[] = [];
    // const sameAddressTokens: {
    //   [key: string]: { tokenId: string; tokenUri: string; songId: string };
    // } = {};
    for await (const token of tokens) {
      const address = token.token_address;
      const tokenId = token.token_id;
      // Redis Implementation
      // const key = address + "-" + tokenId;
      // const isTokenExists = await this.redisClient.exists(key);
      const redisTokenId = await this.redisClient.hGet(
        address,
        REDIS_KEYS.tokenId
      );

      if (redisTokenId) {
        // Address already available, look for tokenId
        if (redisTokenId === tokenId) continue;
        newTokens.push({ address, tokenId });
        // sameAddressTokens[address] = {
        //   tokenId,
        //   tokenUri: redisTokenUri as string,
        //   songId,
        // };
        // If same token Id, it won't even be considered for next loop.

        // Ignore
      } else {
        // New Address found
        // await this.redisClient.hSet(address, REDIS_KEYS.tokenId, tokenId);
        newTokens.push({ address, tokenId });
      }
    }
    console.log("Found", newTokens.length, "new nfts out of", tokens.length);
    return { newTokens };
  }

  async storeNft(newMusicNft: IZoraData) {
    const nusicNftModel = getNusicNftModel(newMusicNft);
    //Store NFT record in firebase
    try {
      await addNftToDb(newMusicNft.collectionAddress, nusicNftModel);
    } catch (e: any) {
      console.log("Error while saving NFT collection: ", e.message);
    }
    const nusicTokenData = getNusicTokenData(newMusicNft);
    //Store the Subcollection in firebase
    try {
      await addTokenToNftCollection(
        newMusicNft.collectionAddress,
        newMusicNft.tokenId,
        nusicTokenData
      );
    } catch (e: any) {
      console.log(
        "Error while saving Token in NFT sub-collection: ",
        e.message
      );
    }
  }
  async storeNftToken(newMusicNft: IZoraData) {
    const nusicTokenData = getNusicTokenData(newMusicNft);
    //Store the Subcollection in firebase
    try {
      await addTokenToNftCollection(
        newMusicNft.collectionAddress,
        newMusicNft.tokenId,
        nusicTokenData
      );
    } catch (e: any) {
      console.log(
        "Error while saving Token in NFT sub-collection: ",
        e.message
      );
    }
  }

  async storeSong(token: IZoraData) {
    const nftSongData = getNftSongData(token);
    const orginalUrl = await createUrlFromCid(token.content?.url ?? "");
    const audioSize = Math.round(Number(token.content?.size) / 1048576); // 1048576
    const imageSize = Math.round(Number(token.image?.size) / 1048576);
    const audioType = token.content?.mimeType ?? "audio/mpeg";
    const imageType = token.image?.mimeType ?? "image/png";
    const lowQualityUrl = token.content?.mediaEncoding?.original;

    await this.redisClient.hSet(
      nftSongData.tokenAddress,
      REDIS_KEYS.tokenUri,
      token.content?.url || ""
    );

    if (!orginalUrl || !lowQualityUrl) {
      console.log(
        `Url not found for: ${token.collectionAddress} - ${
          token.tokenId
        }. Original: ${!!orginalUrl}, Low: ${!!lowQualityUrl}`
      );
    }
    nftSongData.audioContent.originalUrl = orginalUrl;
    nftSongData.audioContent.streamUrl = lowQualityUrl;
    if (audioSize < 20) {
      if (orginalUrl) {
        // await fetchAndUpload(
        //   orginalUrl,
        //   `tokens/ethereum/1/${token.collectionAddress}/${token.tokenId}/audio/original`,
        //   audioType
        // );
      }
      if (lowQualityUrl) {
        try {
          // await fetchAndUpload(
          //   lowQualityUrl,
          //   `tokens/ethereum/1/${token.collectionAddress}/${token.tokenId}/audio/stream-url`,
          //   audioType
          // );
        } catch (e: any) {
          nftSongData.nativeAudioUrl = true;
          console.log("Error in uploading audio file: ", e.message);
        }
      } else {
        //TODO: Convert to low quality
      }
    } else {
      nftSongData.nativeAudioUrl = true;
    }

    // Image
    const originalImageUrl = await createUrlFromCid(token.image?.url ?? "");
    const posterImageUrl = token.content?.mediaEncoding?.poster;
    nftSongData.imageContent.originalUrl = originalImageUrl;
    nftSongData.imageContent.posterUrl = originalImageUrl;

    if (imageSize < 20) {
      if (originalImageUrl) {
        // await fetchAndUpload(
        //   originalImageUrl,
        //   `tokens/ethereum/1/${token.collectionAddress}/${token.tokenId}/image/original`,
        //   imageType
        // );
      }
      if (posterImageUrl) {
        try {
          // await fetchAndUpload(
          //   posterImageUrl,
          //   `tokens/ethereum/1/${token.collectionAddress}/${token.tokenId}/image/poster`,
          //   imageType
          // );
        } catch (e: any) {
          nftSongData.nativeAudioUrl = true;
          console.log("Error in uploading image file: ", e.message);
        }
      }
    } else {
      nftSongData.nativeImageUrl = true;
    }
    try {
      const songId = await addSongToDb(nftSongData);
      await this.redisClient.hSet(
        token.collectionAddress,
        REDIS_KEYS.songId,
        songId
      );
      await this.redisClient.incr(REDIS_KEYS.noOfMusicNfts);
    } catch (e: any) {
      console.log("Error in addSongDb: ", e.message);
    }
  }

  async handleMusicNft(newMusicNft: IZoraData) {
    const address = newMusicNft.collectionAddress;
    const tokenId = newMusicNft.tokenId;
    const [redisTokenUri, redisTokenId, songId] = await this.redisClient.hmGet(
      address,
      [REDIS_KEYS.tokenUri, REDIS_KEYS.tokenId, REDIS_KEYS.songId]
    );
    if (redisTokenId) {
      if (redisTokenId === tokenId) return;
      await this.storeNftToken(newMusicNft);
      console.log("Token is stored for: ", address);
      if (newMusicNft.content?.url === redisTokenUri) {
        console.log("Token is a Single Edition");
        await updateSongToDb(
          songId,
          newMusicNft.tokenId,
          newMusicNft.collectionName ??
            newMusicNft.tokenContract?.name ??
            newMusicNft.name
        );
        // await this.redisClient.hSet(address, "songEdition", 'Single');
        //hset songEdition
      } else {
        console.log("Storing the song for: ", newMusicNft.tokenId);
        await this.storeSong(newMusicNft);
        // await this.redisClient.hSet(address, "songEdition", 'Multiple');
        //hset songEdition
      }
    } else {
      await this.storeNft(newMusicNft);
      console.log("Nft is stored for: ", address);
      await this.storeSong(newMusicNft);
      console.log("New Song is added for: ", address);
    }
  }

  async resume() {
    const block = await this.redisClient.get(REDIS_KEYS.currentBlock);
    this.latestBlock = Number(block) - 1;
    this.start();
  }

  async start() {
    // TODO: Node Cluster
    // let i = this.latestBlock;
    while (this.latestBlock > 0) {
      // this.i -= 1;
      // this.latestBlock = this.blocks[this.i];
      this.redisClient.set(REDIS_KEYS.currentBlock, this.latestBlock);
      console.log(
        "Block: ",
        this.latestBlock,
        "in progress... Total passed blocks:",
        this.startBlock - this.latestBlock
      );
      try {
        const nftTransfers = await getNftTransfersFromBlock(this.latestBlock);
        if (nftTransfers.length) {
          const { newTokens } = await this.identifyNewNftsFromRedis(
            nftTransfers
          );
          if (newTokens.length) {
            // Find music NFTs
            try {
              const newMusicNfts = await getMusicNFTMetadata(newTokens);
              console.log("No of Music NFTs found: ", newMusicNfts.length);
              if (newMusicNfts.length) {
                for (const newMusicNft of newMusicNfts) {
                  console.log(
                    "Handling ",
                    newMusicNft.collectionAddress,
                    " tokenId ",
                    newMusicNft.tokenId
                  );
                  await this.handleMusicNft(newMusicNft);
                  await this.redisClient.hSet(
                    newMusicNft.collectionAddress,
                    REDIS_KEYS.tokenId,
                    newMusicNft.tokenId
                  );
                  // await this.destructDataFromNft(musicNft, sameAddressTokens);
                }
              }
            } catch (e: any) {
              console.log("Handling Error: ", e.message);
            } finally {
              this.latestBlock -= 1;
            }
          } else {
            this.latestBlock -= 1;
          }
        } else {
          this.latestBlock -= 1;
        }
      } catch (err: any) {
        console.log(
          "Error with moralis api at block",
          this.latestBlock,
          err.message
        );
      }
    }
  }
}
// MORALIS implementation:

// const metadata = await Moralis.EvmApi.nft.getNFTMetadata({
//   address,
//   tokenId,
//   chain,
// });

// const tokenUri = metadata?.result.tokenUri;
// if (tokenUri) {
//   getAudioDataFromNft(tokenUri);
// }

// async destructDataFromNft(
//   musicNft: any,
//   sameAddressTokens: {
//     [key: string]: { tokenId: string; tokenUri: string; updated: boolean };
//   }
// ) {
//   console.time();
//   const token = musicNft.token;
//   // let editionType: EditionType = "Unknown";
//   // if (!sameAddressTokens[token.address]) {
//   //   await this.redisClient.hSet(token.address, "tokenUri", token.tokenUrl);
//   // } else if (token.tokenUrl === sameAddressTokens[token.address].tokenUri) {
//   //   editionType = "Multiple";
//   // } else {
//   //   editionType = "Single";
//   // }
//   const newSong: NusicSong = getNusicSongModel(token, editionType);
//   //TODO: Metadata Attributes
//   // Music
//   if (editionType === "Unknown" || editionType === "Multiple") {
//     const orginalUrl = token.content?.url;
//     const lowQualityUrl = token.content?.mediaEncoding?.original;

//     if (!orginalUrl || !lowQualityUrl) {
//       console.log(
//         `Url not found for: ${token.collectionAddress} - ${
//           token.tokenId
//         }. Original: ${!!orginalUrl}, Low: ${!!lowQualityUrl}`
//       );
//     }
//     if (orginalUrl) {
//       const url = await createUrlFromCid(orginalUrl);
//       await fetchAndUpload(
//         url,
//         `tokens/${token.collectionAddress}/${token.tokenId}/audio/original`,
//         "audio/mp3"
//       );
//       newSong.audioContent.originalUrl = `${token.collectionAddress}/${token.tokenId}`;
//     }
//     if (lowQualityUrl) {
//       await fetchAndUpload(
//         lowQualityUrl,
//         `tokens/${token.collectionAddress}/${token.tokenId}/audio/stream-url`,
//         "audio/mp3"
//       );
//       newSong.audioContent.streamUrl = `${token.collectionAddress}/${token.tokenId}`;
//     } else {
//       // Convert to low quality
//     }

//     // Image
//     const originalImageUrl = token.image?.url;
//     if (originalImageUrl) {
//       const url = await createUrlFromCid(originalImageUrl);
//       await fetchAndUpload(
//         url,
//         `tokens/${token.collectionAddress}/${token.tokenId}/image/original`,
//         "image/png"
//       );
//       newSong.imageContent.originalUrl = `${token.collectionAddress}/${token.tokenId}`;
//     }
//   } else {
//     newSong.audioContent.originalUrl = `${token.collectionAddress}/${
//       sameAddressTokens[token.address].tokenId
//     }`;
//     newSong.audioContent.streamUrl = `${token.collectionAddress}/${
//       sameAddressTokens[token.address].tokenId
//     }`;
//     newSong.imageContent.originalUrl = `${token.collectionAddress}/${
//       sameAddressTokens[token.address].tokenId
//     }`;

//     //UPDATE previous record once
//     await updateSongToDb(
//       token.address,
//       sameAddressTokens[token.address].tokenId,
//       editionType
//     );
//   }

//   // Save row
//   try {
//     await addSongToDb(newSong);
//     console.log(
//       `Successfully saved: ${newSong.tokenAddress}: ${newSong.tokenId}`
//     );
//     this.musicNFTsLength += 1;
//     console.timeEnd();
//     console.log(
//       "No of Music NFTs loaded after 976 blocks: ",
//       this.musicNFTsLength
//     );
//   } catch (err: any) {
//     console.log(newSong);
//     console.log(`DB Error: `, err.message);
//   }
// }
