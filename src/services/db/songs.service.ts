import {
  // collection,
  // query,
  // getDocs,
  // limit,
  // where,
  // documentId,
  doc,
  // getDoc,
  addDoc,
  updateDoc,
  collection,
  arrayUnion,
  // increment,
} from "firebase/firestore";
import { NftSong } from "../../types/NftSong";
// import { NusicSong } from "../../types/NusicSong";
import { db } from "../firebase.service";

const DB_NAME = "songs";

const addSongToDb = async (song: NftSong): Promise<string> => {
  const d = collection(db, DB_NAME);
  const docRef = await addDoc(d, song);
  return docRef.id;
};
const updateSongToDb = async (
  songId: string,
  tokenId: string,
  collectionName: string | null | undefined
) => {
  const d = doc(db, DB_NAME, songId);
  await updateDoc(d, {
    editionType: "Single",
    tokenIds: arrayUnion(tokenId),
    name: collectionName,
  });
};

export { addSongToDb, updateSongToDb };
