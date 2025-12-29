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
import type { Invite, CreateInviteInput } from "./types";

const INVITES_COLLECTION = "invites";

/**
 * Créer une nouvelle invitation
 */
export async function createInvite(
  data: CreateInviteInput
): Promise<Invite> {
  try {
    const inviteData = {
      email: data.email.toLowerCase(),
      role: data.role || "Subcontractor",
      status: "Invited" as const,
      token: data.token,
      order_id: data.order_id || null,
      type: data.type || "NETWORK_ONBOARDING",
      aor_admin: data.aor_admin,
      created_at: Timestamp.now(),
      expires_at: data.expires_at
        ? Timestamp.fromMillis(data.expires_at)
        : null,
    };

    const docRef = await addDoc(collection(db, INVITES_COLLECTION), inviteData);

    return {
      id: docRef.id,
      email: inviteData.email,
      role: inviteData.role,
      status: inviteData.status,
      token: inviteData.token,
      order_id: inviteData.order_id,
      type: inviteData.type,
      aor_admin: inviteData.aor_admin,
      created_at: Date.now(),
      expires_at: data.expires_at || null,
    };
  } catch (error) {
    console.error("Error creating invite:", error);
    throw new Error("Failed to create invite");
  }
}

/**
 * Trouver une invitation par token
 */
export async function findInviteByToken(
  token: string
): Promise<Invite | null> {
  try {
    const q = query(
      collection(db, INVITES_COLLECTION),
      where("token", "==", token)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      email: data.email,
      role: data.role,
      status: data.status,
      token: data.token,
      order_id: data.order_id,
      type: data.type,
      aor_admin: data.aor_admin,
      created_at: data.created_at?.toMillis() || Date.now(),
      expires_at: data.expires_at?.toMillis() || null,
    };
  } catch (error) {
    console.error("Error finding invite by token:", error);
    return null;
  }
}

/**
 * Trouver une invitation par ID
 */
export async function findInviteById(id: string): Promise<Invite | null> {
  try {
    const docRef = doc(db, INVITES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();

    return {
      id: docSnap.id,
      email: data.email,
      role: data.role,
      status: data.status,
      token: data.token,
      order_id: data.order_id,
      type: data.type,
      aor_admin: data.aor_admin,
      created_at: data.created_at?.toMillis() || Date.now(),
      expires_at: data.expires_at?.toMillis() || null,
    };
  } catch (error) {
    console.error("Error finding invite by id:", error);
    return null;
  }
}

/**
 * Mettre à jour le statut d'une invitation
 */
export async function updateInviteStatus(
  id: string,
  status: "Invited" | "Active" | "Rejected"
): Promise<boolean> {
  try {
    const docRef = doc(db, INVITES_COLLECTION, id);
    await updateDoc(docRef, {
      status: status,
    });
    return true;
  } catch (error) {
    console.error("Error updating invite status:", error);
    return false;
  }
}

/**
 * Trouver toutes les invitations d'un AoR
 */
export async function findInvitesByAoR(
  aor_admin: string
): Promise<Invite[]> {
  try {
    const q = query(
      collection(db, INVITES_COLLECTION),
      where("aor_admin", "==", aor_admin)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        status: data.status,
        token: data.token,
        order_id: data.order_id,
        type: data.type,
        aor_admin: data.aor_admin,
        created_at: data.created_at?.toMillis() || Date.now(),
        expires_at: data.expires_at?.toMillis() || null,
      };
    });
  } catch (error) {
    console.error("Error finding invites by AoR:", error);
    return [];
  }
}

