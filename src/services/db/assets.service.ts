import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase.service";

const addAssetToDb = async (assetObj: any) => {
  await addDoc(collection(db, "assets"), assetObj);
};

export { addAssetToDb };
