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
import { addSongToDb, updateSongToDb } from "./services/db/songsV1.service";
import { getNftTransfersFromBlock } from "./helpers/moralis";
import { getMusicNFTMetadata } from "./helpers/zora";
import {
  getNftSongData,
  getNusicNftModel,
  getNusicSongModel,
  getNusicTokenData,
} from "./helpers";
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
  public startBlock: number = 16412971;
  public latestBlock: number = 16411946;
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
    const sameAddressTokens: {
      [key: string]: { tokenId: string; tokenUri: string; songId: string };
    } = {};
    for await (const token of tokens) {
      const address = token.token_address;
      const tokenId = token.token_id;
      // Redis Implementation
      // const key = address + "-" + tokenId;
      // const isTokenExists = await this.redisClient.exists(key);
      const [redisTokenUri, redisTokenId, songId] =
        await this.redisClient.hmGet(address, [
          REDIS_KEYS.tokenUri,
          REDIS_KEYS.tokenId,
          REDIS_KEYS.songId,
        ]);

      if (redisTokenId) {
        // Address already available, look for tokenId
        if (redisTokenId !== tokenId) {
          newTokens.push({ address, tokenId });
          sameAddressTokens[address] = {
            tokenId,
            tokenUri: redisTokenUri as string,
            songId,
          };
          // If same token Id, it won't even be considered for next loop.
        }
        // Ignore
      } else {
        // New Address found
        // this.redisClient.set(key, 0);
        await this.redisClient.hSet(address, REDIS_KEYS.tokenId, tokenId);
        newTokens.push({ address, tokenId });
      }
    }
    console.log("Found", newTokens.length, "new nfts out of", tokens.length);
    return { newTokens, sameAddressTokens };
  }

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
    const orginalUrl = token.content?.url;
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
    if (orginalUrl) {
      const url = await createUrlFromCid(orginalUrl);
      await fetchAndUpload(
        url,
        `tokens/${token.collectionAddress}/${token.tokenId}/audio/original`,
        "audio/mp3"
      );
      nftSongData.audioContent.originalUrl = `${token.collectionAddress}/${token.tokenId}`;
    }
    if (lowQualityUrl) {
      await fetchAndUpload(
        lowQualityUrl,
        `tokens/${token.collectionAddress}/${token.tokenId}/audio/stream-url`,
        "audio/mp3"
      );
      nftSongData.audioContent.streamUrl = `${token.collectionAddress}/${token.tokenId}`;
    } else {
      // Convert to low quality
    }

    // Image
    const originalImageUrl = token.image?.url;
    if (originalImageUrl) {
      const url = await createUrlFromCid(originalImageUrl);
      await fetchAndUpload(
        url,
        `tokens/${token.collectionAddress}/${token.tokenId}/image/original`,
        "image/png"
      );
      nftSongData.imageContent.originalUrl = `${token.collectionAddress}/${token.tokenId}`;
    }
    try {
      const songId = await addSongToDb(nftSongData);
      await this.redisClient.hSet(
        token.collectionAddress,
        REDIS_KEYS.songId,
        songId
      );
      await this.redisClient.incr(REDIS_KEYS.noOfMusicNfts);
    } catch (e) {}
  }

  async handleMusicNft(
    newMusicNft: IZoraData,
    sameAddressTokens: {
      [key: string]: { tokenId: string; tokenUri: string; songId: string };
    }
  ) {
    const address = newMusicNft.collectionAddress;
    if (sameAddressTokens[address]) {
      await this.storeNftToken(newMusicNft);
      console.log("Token is stored for: ", address);
      if (newMusicNft.content?.url === sameAddressTokens[address].tokenUri) {
        console.log("Token is a Single Edition");
        await updateSongToDb(
          sameAddressTokens[address].songId,
          newMusicNft.tokenId
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
          const { newTokens, sameAddressTokens } =
            await this.identifyNewNftsFromRedis(nftTransfers);
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
                  await this.handleMusicNft(newMusicNft, sameAddressTokens);
                  // await this.destructDataFromNft(musicNft, sameAddressTokens);
                }
              }
            } catch (e: any) {
              console.log("Error: ", e.message);
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
