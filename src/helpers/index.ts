import { createUrlFromCid, getDataFromCid, getFileFormatFromUrl } from "./nft";

const getAudioDataFromNft = async (tokenUri: string) => {
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

export default getAudioDataFromNft;
