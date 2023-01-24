import axios from "axios";

export const getDataFromCid = async (tokenUri: string) => {
  // TODO: data:base64
  if (tokenUri.includes("https")) {
    return axios.get(tokenUri);
  } else if (tokenUri.startsWith("ipfs")) {
    const cid = tokenUri.split("ipfs://")[1];
    return axios.get(`https://ipfs.io/ipfs/${cid}`);
  } else if (tokenUri.startsWith("ar")) {
    const addressWithTokenId = tokenUri.split("ar://")[1];
    return axios.get(`https://arweave.net/${addressWithTokenId}`);
  }
};

export const createUrlFromCid = (tokenUri: string) => {
  if (tokenUri.includes("https")) {
    return tokenUri;
  } else if (tokenUri.startsWith("ipfs")) {
    const cid = tokenUri.split("ipfs://")[1];
    return `https://ipfs.io/ipfs/${cid}`;
  } else if (tokenUri.startsWith("ar")) {
    const addressWithTokenId = tokenUri.split("ar://")[1];
    return `https://arweave.net/${addressWithTokenId}`;
  } else {
    console.log(`New Url type found: ${tokenUri}`);
    return tokenUri;
  }
};

export const getFileFormatFromUrl = async (
  url: string
): Promise<"image" | "audio" | "video" | "unknown"> => {
  const extension = url.split(".").pop();
  if (extension) {
    const audioExtensions = ["mp3", "wav", "m4a", "aac"];
    const videoExtensions = ["mp4", "m4v", "mov", "avi", "wmv", "flv", "mkv"];
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

    if (audioExtensions.includes(extension)) {
      return "audio";
    } else if (videoExtensions.includes(extension)) {
      return "video";
    } else if (imageExtensions.includes(extension)) {
      return "image";
    } else {
      return fetchTypeFromHeaders(url);
    }
  } else {
    return fetchTypeFromHeaders(url);
  }
};

const fetchTypeFromHeaders = async (url: string) => {
  const response = await axios.head(url);
  const fileFormat = response.headers["content-type"];
  return getFormatFromMimeType(fileFormat || "");
};

const getFormatFromMimeType = (
  type: string
): "image" | "audio" | "video" | "unknown" => {
  const imageMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/webp",
  ];
  const audioMimeTypes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/mp4",
    "audio/wav",
    "audio/aac",
  ];
  const videoMimeTypes = [
    "video/mp4",
    "video/mpeg",
    "video/ogg",
    "video/webm",
    "video/quicktime",
  ];

  if (audioMimeTypes.includes(type)) {
    return "audio";
  } else if (videoMimeTypes.includes(type)) {
    return "video";
  } else if (imageMimeTypes.includes(type)) {
    return "image";
  } else {
    return "unknown";
  }
};
