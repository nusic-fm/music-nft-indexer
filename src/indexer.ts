// import Moralis from "moralis";
import { RedisClientType } from "@redis/client";
import { ZDK, ZDKNetwork, ZDKChain } from "@zoralabs/zdk";
// import { MediaType } from "@zoralabs/zdk/dist/queries/queries-sdk";
// import { tokensQuery } from "./helpers/queries";
// import axios from "axios";
// import path from "path";
// import { MediaType } from "@zoralabs/zdk/dist/queries/queries-sdk";
// import fetchAndUpload from "./services/storage";
import { createUrlFromCid } from "./helpers/nft";
// import { EditionType, NusicSong } from "./types/NusicSong";
import { addSongToDb, updateSongToDb } from "./services/db/songs.service";
import { getNftTransfersFromBlock } from "./helpers/moralis";
import { getNFTsMetadata } from "./helpers/zora";
import { getNftSongData, getNusicNftModel, getNusicTokenData } from "./helpers";
import { addNftToDb } from "./services/db/collections.service";
import { IZoraData } from "./types/Zora";
import { addAssetToDb } from "./services/db/assets.service";
import { addTokenToDb } from "./services/db/tokens.service";
import { logError } from "./services/db/errors.service";
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
  totalBlocksPassed: "totalBlocksPassed",
  tokenUri: "tokenUri",
  tokenId: "tokenId",
  songId: "songId",
};

export class MoralisIndexer {
  public startBlock: number = 16000000;
  public latestBlock: number = 15000000;
  public redisClient: RedisClientType = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
  });
  public zoraClient: ZDK;
  public breakCounter: number = 0;

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
  async getPassedBlocks(): Promise<string | null> {
    return this.redisClient.get(REDIS_KEYS.totalBlocksPassed);
  }
  async getCurrentBlock(): Promise<string | null> {
    return this.redisClient.get(REDIS_KEYS.currentBlock);
  }

  async identifyNewNftsFromRedis(
    tokens: { token_address: string; token_id: string }[]
  ) {
    const newTokens: { address: string; tokenId: string }[] = [];
    for await (const token of tokens) {
      const address = token.token_address;
      const tokenId = token.token_id;
      // const isNonMusicNft = await this.redisClient.exists(address);
      // if (isNonMusicNft) {
      //   continue;
      // }
      // Redis Implementation
      const key = `${address}:${tokenId}`;
      const isTokenAlreadyExists = await this.redisClient.exists(key);
      if (isTokenAlreadyExists) {
        continue;
      }
      newTokens.push({ address, tokenId });
    }
    console.log("Found", newTokens.length, "new nfts out of", tokens.length);
    return newTokens;
  }

  async storeNft(newMusicNft: IZoraData) {
    const nusicNftModel = getNusicNftModel(newMusicNft, this.latestBlock);
    //Store NFT record in firebase
    try {
      await addNftToDb(newMusicNft.collectionAddress, nusicNftModel);
    } catch (e: any) {
      await logError(
        this.latestBlock,
        e.message,
        "Error while saving NFT collection"
      );
      // console.log("Error while saving NFT collection: ", e.message);
    }
    const nusicTokenData = getNusicTokenData(newMusicNft, this.latestBlock);
    //Store the Subcollection in firebase
    try {
      await addTokenToDb(
        `${newMusicNft.collectionAddress}-${newMusicNft.tokenId}`,
        nusicTokenData
      );
    } catch (e: any) {
      await logError(this.latestBlock, e.message, "Error while saving Token");
      // console.log(
      //   "Error while saving Token in NFT sub-collection: ",
      //   e.message
      // );
    }
  }
  async storeNftToken(newMusicNft: IZoraData) {
    const nusicTokenData = getNusicTokenData(newMusicNft, this.latestBlock);
    //Store the Subcollection in firebase
    try {
      await addTokenToDb(
        `${newMusicNft.collectionAddress}-${newMusicNft.tokenId}`,
        nusicTokenData
      );
    } catch (e: any) {
      await logError(this.latestBlock, e.message, "Error while saving Token");
      // console.log(
      //   "Error while saving Token in NFT sub-collection: ",
      //   e.message
      // );
    }
  }

  async storeSong(token: IZoraData): Promise<void> {
    const nftSongData = getNftSongData(token, this.latestBlock);
    const orginaAudiolUrl = await createUrlFromCid(token.content?.url ?? "");
    const audioSize = Number(token.content?.size) ?? -1; //Math.round(Number(token.content?.size) / 1048576); // 1048576
    const imageSize = Number(token.image?.size) ?? -1; //Math.round(Number(token.image?.size) / 1048576);
    const audioType = token.content?.mimeType ?? "audio/mpeg";
    const imageType = token.image?.mimeType ?? "image/png";
    const lowQualityUrl = token.content?.mediaEncoding?.large;

    await this.redisClient.hSet(
      `mnft:${nftSongData.tokenAddress}`,
      REDIS_KEYS.tokenUri,
      token.content?.url || ""
    );

    if (!orginaAudiolUrl || !lowQualityUrl) {
      console.log(
        `Url not found for: ${token.collectionAddress} - ${
          token.tokenId
        }. Original: ${!!orginaAudiolUrl}, Low: ${!!lowQualityUrl}`
      );
    }
    nftSongData.nativeContent.audio.originalUrl = orginaAudiolUrl;
    nftSongData.nativeContent.audio.streamUrl = lowQualityUrl;

    // Image
    const originalImageUrl = await createUrlFromCid(token.image?.url ?? "");
    const posterImageUrl = token.image?.mediaEncoding?.poster;
    nftSongData.nativeContent.image.originalUrl = originalImageUrl;
    nftSongData.nativeContent.image.posterUrl = posterImageUrl;

    const assetObj: {
      tokenAddress: string;
      tokenId: string;
      audioSize: number;
      imageSize: number;
      blockNo: number;
      audioContent: {
        originalUrl: string;
        streamUrl?: string | null;
        audioType: string;
        audioSize: number;
      };
      imageContent: {
        originalUrl: string;
        posterUrl?: string | null;
        imageType: string;
        imageSize: number;
      };
      loaded: boolean;
    } = {
      tokenAddress: nftSongData.tokenAddress,
      tokenId: nftSongData.tokenId,
      audioSize,
      imageSize,
      audioContent: {
        originalUrl: orginaAudiolUrl,
        streamUrl: lowQualityUrl,
        audioType,
        audioSize,
      },
      imageContent: {
        originalUrl: originalImageUrl,
        posterUrl: posterImageUrl,
        imageType,
        imageSize,
      },
      loaded: false,
      blockNo: this.latestBlock,
    };
    try {
      const songId = await addSongToDb(nftSongData);
      await this.redisClient.hSet(
        `mnft:${nftSongData.tokenAddress}`,
        REDIS_KEYS.songId,
        songId
      );
      await addAssetToDb(songId, assetObj);
      await this.redisClient.incr(REDIS_KEYS.noOfMusicNfts);
    } catch (e: any) {
      await logError(this.latestBlock, e.message, "Error in addSongDb/assets");
      // console.log("Error in addSongDb/assets: ", e.message);
    }
  }

  async handleMusicNft(newMusicNft: IZoraData) {
    const address = newMusicNft.collectionAddress;
    const tokenId = newMusicNft.tokenId;
    // const key = `${address}:${tokenId}`;

    // const isAlreadyLoaded = await this.redisClient.exists(key);
    // if (isAlreadyLoaded) return;
    const isCollectionAlreadySaved = await this.redisClient.exists(
      `mnft:${address}`
    );
    if (isCollectionAlreadySaved) {
      const [redisTokenUri, songId] = await this.redisClient.hmGet(
        `mnft:${address}`,
        [REDIS_KEYS.tokenUri, REDIS_KEYS.songId]
      );
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
      } else {
        console.log("Storing a new song for: ", newMusicNft.tokenId);
        await this.storeSong(newMusicNft);
      }
    } else {
      await this.storeNft(newMusicNft);
      await this.redisClient.hSet(
        `mnft:${address}`,
        REDIS_KEYS.tokenId,
        tokenId
      );
      await this.storeSong(newMusicNft);
    }
  }

  async resume() {
    const block = await this.redisClient.get(REDIS_KEYS.currentBlock);
    this.latestBlock = Number(block) - 1;
    this.start();
  }

  async start() {
    // let i = this.latestBlock;
    while (this.latestBlock > 0) {
      // this.i -= 1;
      // this.latestBlock = this.blocks[this.i];
      await this.redisClient.set(REDIS_KEYS.currentBlock, this.latestBlock);
      await this.redisClient.set(
        REDIS_KEYS.totalBlocksPassed,
        this.startBlock - this.latestBlock
      );
      console.log(
        "Block: ",
        this.latestBlock,
        "in progress... Total passed blocks:",
        this.startBlock - this.latestBlock
      );
      try {
        const nftTransfers = await getNftTransfersFromBlock(this.latestBlock);
        if (nftTransfers.length) {
          this.breakCounter = 0;
          const newTokens = await this.identifyNewNftsFromRedis(nftTransfers);
          if (newTokens.length) {
            // Find music NFTs
            try {
              const metadataNodes = await getNFTsMetadata(newTokens);
              const newMusicNfts = [];
              for (const node of metadataNodes) {
                const token = node.token as IZoraData;
                if (node.token.tokenUrlMimeType?.split("/")[0] === "audio") {
                  newMusicNfts.push(node.token as IZoraData);
                } else {
                  // non-music nfts
                  // await this.redisClient.set(token.collectionAddress, 0);
                }
              }
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
                  await this.redisClient.set(
                    `${newMusicNft.collectionAddress}:${newMusicNft.tokenId}`,
                    this.latestBlock
                  );
                }
              }
            } catch (e: any) {
              await logError(
                this.latestBlock,
                e.message,
                "Handling/Zora Error"
              );
              // console.log("Handling Error: ", e.message);
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
        await logError(this.latestBlock, err.message, "Error with moralis api");
        if (this.breakCounter === 5) {
          this.latestBlock = -1;
        } else {
          this.breakCounter += 1;
        }
        // this.latestBlock = -1;
        // console.log(
        //   "Error with moralis api at block",
        //   this.latestBlock,
        //   err.message
        // );
      }
    }
  }
}
