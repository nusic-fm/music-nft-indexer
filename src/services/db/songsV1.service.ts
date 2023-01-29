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

const addSongToDb = async (song: NftSong): Promise<string> => {
  const d = collection(db, "songs_v3");
  const docRef = await addDoc(d, song);
  return docRef.id;
};
const updateSongToDb = async (songId: string, tokenId: string) => {
  const d = doc(db, "songs_v3", songId);
  await updateDoc(d, { editionType: "Single", tokenIds: arrayUnion(tokenId) });
};

export { addSongToDb, updateSongToDb };
