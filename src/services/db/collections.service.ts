import {
  arrayUnion,
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
  // updateDoc,
  // increment,
} from "firebase/firestore";
import { NftCollectionData } from "../../types/NftData";
// import { NusicSong } from "../../types/NusicSong";
import { db } from "../firebase.service";

const DB_NAME = "collections";

const addNftToDb = async (nftAddress: string, nftData: NftCollectionData) => {
  const d = doc(db, DB_NAME, nftAddress);
  await setDoc(d, nftData);
};

const updateNftCollection = async (nftAddress: string, tokenId: string) => {
  const d = doc(db, DB_NAME, nftAddress);
  await updateDoc(d, {
    tokenIds: arrayUnion(tokenId),
  });
};

export { addNftToDb, updateNftCollection };
