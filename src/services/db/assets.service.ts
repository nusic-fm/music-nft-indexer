import { setDoc, doc } from "firebase/firestore";
import { db } from "../firebase.service";

const DB_NAME = "assets";

const addAssetToDb = async (id: string, assetObj: any): Promise<void> => {
  const d = doc(db, DB_NAME, id);
  await setDoc(d, assetObj);
};

export { addAssetToDb };
