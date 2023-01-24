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
import { NusicSong } from "../../types/NusicSong";
import { db } from "../firebase.service";

const addSongToDb = async (song: NusicSong) => {
  const songId = `${song.tokenAddress}-${song.tokenId}`;
  const d = doc(db, "songs_v1", songId);
  await setDoc(d, {
    ...song,
  });
};

export { addSongToDb };
