import axios from "axios";
import { IZoraData } from "../types/Zora";
import { tokensQuery } from "./queries";

export const getMusicNFTMetadata = async (
  newTokens: { address: string; tokenId: string }[]
) => {
  // const response = await this.zoraClient.tokens({
  //   where: { tokens: filter },
  //   // filter: { mediaType: MediaType.Audio },
  // });
  const endpoint = "https://api.zora.co/graphql";
  const headers = {
    "content-type": "application/json",
  };
  const tokensMetadata = [];
  let hasNextPage = false;
  let endCursor: string | null = null;
  do {
    const graphqlQuery: any = {
      // operationName: "fetchTokens",
      query: tokensQuery,
      variables: {
        where: newTokens,
        endCursor,
      },
    };
    const response = await axios({
      url: endpoint,
      method: "post",
      headers: headers,
      data: graphqlQuery,
    });
    const audioFilteredNodes = response.data.data.tokens.nodes
      .filter(
        (node: any) =>
          // !!node.token.metadata?.animation_url
          node.token.tokenUrlMimeType?.split("/")[0] === "audio"
        // "audio/mpeg" === node.token.tokenUrlMimeType
        // ["VideoEncodingTypes", "AudioEncodingTypes"].includes(
        //   node.token.content?.mediaEncoding?.__typename || ""
        // )
      )
      .map((node: any) => node.token) as IZoraData[];

    tokensMetadata.push(...audioFilteredNodes);
    hasNextPage = response.data.data.tokens.pageInfo.hasNextPage;
    endCursor = response.data.data.tokens.pageInfo.endCursor;
  } while (hasNextPage);

  return tokensMetadata;
};
