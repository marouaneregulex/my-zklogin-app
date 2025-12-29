import { getFirestore } from "firebase/firestore";
import { app } from "./config";

// Client Firestore
export const db = getFirestore(app);

