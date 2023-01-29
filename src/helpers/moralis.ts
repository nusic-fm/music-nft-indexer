import axios from "axios";

export const getNftTransfersFromBlock = async (
  block: number
): Promise<any[]> => {
  // const response = await Moralis.EvmApi.nft.getNFTTransfersByBlock({
  //   blockNumberOrHash: this.latestBlock.toString(),
  // });
  const moralisEndpoint = `https://deep-index.moralis.io/api/v2/block/${block}/nft/transfers?chain=eth&disable_total=true`;
  try {
    let cursor: string | null = null;
    const nftTransfers: any = [];
    do {
      const endpoint: string = cursor
        ? `${moralisEndpoint}&cursor=${cursor}`
        : moralisEndpoint;

      const response = await axios.get(endpoint, {
        headers: {
          accept: "application/json",
          "X-API-Key": process.env.MORALIS_API_KEY,
        },
      });
      nftTransfers.push(...response.data.result);
      cursor = response.data.cursor;
    } while (cursor);

    // const nftTransfers = response.data.result;
    // if (response.data.cursor) {
    //   const secondResponse = await axios.get(
    //     `${moralisEndpoint}&cursor=${response.data.cursor}`,
    //     {
    //       headers: {
    //         accept: "application/json",
    //         "X-API-Key": process.env.MORALIS_API_KEY,
    //       },
    //     }
    //   );
    //   const newResults = secondResponse.data.result;
    //   nftTransfers.push(...newResults);
    // }
    console.log("NFT Transfers found: ", nftTransfers.length);
    return nftTransfers;
  } catch (e: any) {
    console.log(`Moralis error at block ${block}: ${e.message}`);
    return [];
  }
};
