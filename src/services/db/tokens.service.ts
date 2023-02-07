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
  // updateDoc,
  // increment,
} from "firebase/firestore";
import { NftTokenData } from "../../types/NftData";
// import { NusicSong } from "../../types/NusicSong";
import { db } from "../firebase.service";

const DB_NAME = "tokens";

const addTokenToDb = async (id: string, nftData: NftTokenData) => {
  const d = doc(db, DB_NAME, id);
  await setDoc(d, nftData);
};

export { addTokenToDb };
