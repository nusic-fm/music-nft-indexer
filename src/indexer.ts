import Moralis from "moralis";
import { RedisClientType } from "@redis/client";
import { ZDK, ZDKNetwork, ZDKChain } from "@zoralabs/zdk";
// import { MediaType } from "@zoralabs/zdk/dist/queries/queries-sdk";
// import { tokensQuery } from "./helpers/queries";
import axios from "axios";
// import path from "path";
// import { MediaType } from "@zoralabs/zdk/dist/queries/queries-sdk";
import fetchAndUpload from "./services/storage";
import { createUrlFromCid, getDataFromCid } from "./helpers/nft";
import { NusicSong } from "./types/NusicSong";
import { addSongToDb } from "./services/db/songsV1.service";
import { tokensQuery } from "./helpers/queries";
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

export class MoralisIndexer {
  public startBlock: number = 16412971;
  public latestBlock: number = 16411542;
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
    await Moralis.start({
      apiKey: process.env.MORALIS_API_KEY,
      // ...and any other configuration
    });
    await this.redisClient.connect();
  }

  async start() {
    // TODO: Node Cluster
    // let i = this.latestBlock;
    while (this.latestBlock > 0) {
      console.log(
        `Block: ${this.latestBlock} in progress... Total passed blocks: ${
          this.startBlock - this.latestBlock
        }`
      );
      // const response = await Moralis.EvmApi.nft.getNFTTransfersByBlock({
      //   blockNumberOrHash: this.latestBlock.toString(),
      // });
      const moralisEndpoint = `https://deep-index.moralis.io/api/v2/block/${this.latestBlock}/nft/transfers?chain=eth`;
      let response: any;
      try {
        response = await axios.get(moralisEndpoint, {
          headers: {
            accept: "application/json",
            "X-API-Key": process.env.MORALIS_API_KEY,
          },
        });
      } catch (e: any) {
        console.log(`Moralis error at block ${this.latestBlock}: ${e.message}`);
      }
      const result = response.data.result;
      if (result.length) {
        const filter: { address: string; tokenId: string }[] = [];

        for await (const token of result) {
          const address = token.token_address;
          const tokenId = token.token_id;
          // Redis Implementation
          const key = address + "-" + tokenId;
          const isTokenExists = await this.redisClient.exists(key);

          if (isTokenExists) {
            // Ignore
            // filter.push({ address, tokenId });
            // const val = await this.redisClient.hGetAll(key);
            // console.log(`get: ${val}`);
          } else {
            this.redisClient.set(key, 0);
            filter.push({ address, tokenId });
          }
        }
        console.log(`Found ${filter.length} new nfts out of ${result.length}`);

        if (filter.length) {
          // Find music NFTs
          try {
            // const response = await this.zoraClient.tokens({
            //   where: { tokens: filter },
            //   // filter: { mediaType: MediaType.Audio },
            // });
            const endpoint = "https://api.zora.co/graphql";
            const headers = {
              "content-type": "application/json",
            };
            const graphqlQuery = {
              // operationName: "fetchTokens",
              query: tokensQuery,
              variables: {
                where: filter,
              },
            };
            const response = await axios({
              url: endpoint,
              method: "post",
              headers: headers,
              data: graphqlQuery,
            });
            const musicNfts = response.data.data.tokens.nodes.filter(
              (node: any) =>
                // !!node.token.metadata?.animation_url
                node.token.tokenUrlMimeType?.split("/")[0] === "audio"
              // "audio/mpeg" === node.token.tokenUrlMimeType
              // ["VideoEncodingTypes", "AudioEncodingTypes"].includes(
              //   node.token.content?.mediaEncoding?.__typename || ""
              // )
            );
            console.log("No of Music NFTs found: ", musicNfts.length);
            if (musicNfts.length) {
              for await (const musicNft of musicNfts) {
                console.time();
                const token = musicNft.token;

                const newSong: NusicSong = {
                  name: token.name,
                  description: token.description,
                  collectionName: token.tokenContract?.name,
                  collectionDescription: token.tokenContract?.description,
                  symbol: token.tokenContract?.symbol,
                  tokenAddress: token.collectionAddress,
                  tokenId: token.tokenId,
                  tokenUri: token.tokenUrl || "",
                  contractType: (token as any).tokenStandard || "",
                  owner: token.owner,
                  mintInfo: {
                    originatorAddress: token.mintInfo?.originatorAddress,
                    toAddress: token.mintInfo?.toAddress,
                  },
                  animationUrl: token.metadata?.animation_url || "",
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
                  artist: token.metadata?.artist || "",
                  bpm: token.metadata?.bpm || "",
                  key: token.metadata?.key || "",
                  tokenUrlMimeType: token.tokenUrlMimeType,
                };
                //TODO: Metadata Attributes
                //      1 of 1
                // Music
                const orginalUrl = token.content?.url;
                const lowQualityUrl = token.content?.mediaEncoding?.original;

                if (!orginalUrl || !lowQualityUrl) {
                  console.log(
                    `Url not found for: ${token.collectionAddress} - ${
                      token.tokenId
                    }. Original: ${!!orginalUrl}, Low: ${!!lowQualityUrl}`
                  );
                }
                if (orginalUrl) {
                  const url = await createUrlFromCid(orginalUrl);
                  const originalUrl = await fetchAndUpload(
                    url,
                    `tokens/${token.collectionAddress}/${token.tokenId}/audio/original`,
                    "audio/mp3"
                  );
                  newSong.audioContent.originalUrl = originalUrl;
                }
                if (lowQualityUrl) {
                  const streamUrl = await fetchAndUpload(
                    lowQualityUrl,
                    `tokens/${token.collectionAddress}/${token.tokenId}/audio/stream-url`,
                    "audio/mp3"
                  );
                  newSong.audioContent.streamUrl = streamUrl;
                } else {
                  // Convert to low quality
                }

                // Image
                const originalImageUrl = token.image?.url;
                if (originalImageUrl) {
                  const url = await createUrlFromCid(originalImageUrl);
                  const originalUrl = await fetchAndUpload(
                    url,
                    `tokens/${token.collectionAddress}/${token.tokenId}/image/original`,
                    "image/png"
                  );
                  newSong.imageContent.originalUrl = originalUrl;
                }
                // Save row
                try {
                  await addSongToDb(newSong);
                  console.log(
                    `Successfully saved: ${newSong.tokenAddress}: ${newSong.tokenId}`
                  );
                  this.musicNFTsLength += 1;
                  console.timeEnd();
                  console.log(
                    "No of Music NFTs loaded after 976 blocks: ",
                    this.musicNFTsLength
                  );
                } catch (err: any) {
                  console.log(newSong);
                  console.log(`DB Error: `, err.message);
                }
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
