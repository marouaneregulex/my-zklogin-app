import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./client";
import type { Vendor, CreateVendorInput } from "./types";

const VENDORS_COLLECTION = "vendors";

/**
 * Créer un nouveau vendor
 */
export async function createVendor(data: CreateVendorInput): Promise<Vendor> {
  try {
    const vendorData = {
      invite_id: data.invite_id,
      email: data.email.toLowerCase(),
      org_object_id: data.org_object_id,
      name: data.name,
      status: (data.status || "Active") as "Active" | "Inactive",
      reputation_score: data.reputation_score || 0,
      aor_admin: data.aor_admin,
      created_at: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, VENDORS_COLLECTION), vendorData);

    return {
      id: docRef.id,
      invite_id: vendorData.invite_id,
      email: vendorData.email,
      org_object_id: vendorData.org_object_id,
      name: vendorData.name,
      status: vendorData.status,
      reputation_score: vendorData.reputation_score,
      aor_admin: vendorData.aor_admin,
      created_at: Date.now(),
    };
  } catch (error) {
    console.error("Error creating vendor:", error);
    throw new Error("Failed to create vendor");
  }
}

/**
 * Trouver un vendor par ID
 */
export async function findVendorById(id: string): Promise<Vendor | null> {
  try {
    const docRef = doc(db, VENDORS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();

    return {
      id: docSnap.id,
      invite_id: data.invite_id,
      email: data.email,
      org_object_id: data.org_object_id,
      name: data.name,
      status: data.status,
      reputation_score: data.reputation_score,
      aor_admin: data.aor_admin,
      created_at: data.created_at?.toMillis() || Date.now(),
    };
  } catch (error) {
    console.error("Error finding vendor by id:", error);
    return null;
  }
}

/**
 * Trouver un vendor par invite_id
 */
export async function findVendorByInviteId(
  invite_id: string
): Promise<Vendor | null> {
  try {
    const q = query(
      collection(db, VENDORS_COLLECTION),
      where("invite_id", "==", invite_id)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      invite_id: data.invite_id,
      email: data.email,
      org_object_id: data.org_object_id,
      name: data.name,
      status: data.status,
      reputation_score: data.reputation_score,
      aor_admin: data.aor_admin,
      created_at: data.created_at?.toMillis() || Date.now(),
    };
  } catch (error) {
    console.error("Error finding vendor by invite_id:", error);
    return null;
  }
}

/**
 * Trouver tous les vendors d'un AoR
 */
export async function findVendorsByAoR(aor_admin: string): Promise<Vendor[]> {
  try {
    const q = query(
      collection(db, VENDORS_COLLECTION),
      where("aor_admin", "==", aor_admin)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        invite_id: data.invite_id,
        email: data.email,
        org_object_id: data.org_object_id,
        name: data.name,
        status: data.status,
        reputation_score: data.reputation_score,
        aor_admin: data.aor_admin,
        created_at: data.created_at?.toMillis() || Date.now(),
      };
    });
  } catch (error) {
    console.error("Error finding vendors by AoR:", error);
    return [];
  }
}

/**
 * Mettre à jour le statut d'un vendor
 */
export async function updateVendorStatus(
  id: string,
  status: "Active" | "Inactive"
): Promise<boolean> {
  try {
    const docRef = doc(db, VENDORS_COLLECTION, id);
    await updateDoc(docRef, {
      status: status,
    });
    return true;
  } catch (error) {
    console.error("Error updating vendor status:", error);
    return false;
  }
}

