import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase.service";

const DB_NAME = "errors";

export const logError = async (
  blockNo: number,
  errorMessage: string,
  customMessage: string
) => {
  const d = collection(db, DB_NAME);
  await addDoc(d, { blockNo, errorMessage, customMessage });
};
