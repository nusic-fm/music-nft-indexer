import {
  // collection,
  // query,
  // getDocs,
  // limit,
  // where,
  // documentId,
  doc,
  // getDoc,
  setDoc,
  updateDoc,
  // increment,
} from "firebase/firestore";
import { NftCollectionData, NftTokenData } from "../../types/NftData";
// import { NusicSong } from "../../types/NusicSong";
import { db } from "../firebase.service";

const DB_NAME = "nfts_v2";

const addNftToDb = async (nftAddress: string, nftData: NftCollectionData) => {
  const d = doc(db, DB_NAME, nftAddress);
  await setDoc(d, nftData);
};

const addTokenToNftCollection = async (
  nftAddress: string,
  tokenId: string,
  tokenData: NftTokenData
) => {
  const d = doc(db, DB_NAME, nftAddress, "tokens", tokenId);
  await setDoc(d, tokenData);
};

export { addNftToDb, addTokenToNftCollection };
