import axios from "axios";
import { IZoraData } from "../types/Zora";
import { tokensQuery } from "./queries";

export const getNFTsMetadata = async (
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
  const tokensMetadata: { token: IZoraData }[] = [];
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
    const nodes = response.data.data?.tokens.nodes;
    if (nodes?.length) {
      tokensMetadata.push(...nodes);
    } else {
      break;
    }
    hasNextPage = response.data.data?.tokens.pageInfo.hasNextPage;
    endCursor = response.data.data?.tokens.pageInfo.endCursor;
  } while (hasNextPage);

  return tokensMetadata;
};
