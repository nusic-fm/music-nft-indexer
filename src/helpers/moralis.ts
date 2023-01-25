import axios from "axios";

export const getNftTransfersFromBlock = async (block: number) => {
  // const response = await Moralis.EvmApi.nft.getNFTTransfersByBlock({
  //   blockNumberOrHash: this.latestBlock.toString(),
  // });
  const moralisEndpoint = `https://deep-index.moralis.io/api/v2/block/${block}/nft/transfers?chain=eth`;
  let response: any;
  try {
    response = await axios.get(moralisEndpoint, {
      headers: {
        accept: "application/json",
        "X-API-Key": process.env.MORALIS_API_KEY,
      },
    });
  } catch (e: any) {
    console.log(`Moralis error at block ${block}: ${e.message}`);
  }
  return response.data.result;
};
