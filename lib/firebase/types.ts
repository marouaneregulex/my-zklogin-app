/**
 * Types TypeScript pour Firestore
 */

export interface Invite {
  id: string;
  email: string;
  role: "Subcontractor" | string;
  status: "Invited" | "Active" | "Rejected";
  token: string;
  order_id: string | null;
  type: "NETWORK_ONBOARDING" | string;
  aor_admin: string;
  created_at: number; // Timestamp en millisecondes
  expires_at: number | null; // Timestamp en millisecondes ou null
}

export interface Vendor {
  id: string;
  invite_id: string;
  email: string;
  org_object_id: string;
  name: string;
  status: "Active" | "Inactive";
  reputation_score: number;
  aor_admin: string;
  created_at: number; // Timestamp en millisecondes
}

// Types pour les données d'entrée (sans id et timestamps)
export interface CreateInviteInput {
  email: string;
  role?: string;
  token: string;
  order_id?: string | null;
  type?: string;
  aor_admin: string;
  expires_at?: number | null;
}

export interface CreateVendorInput {
  invite_id: string;
  email: string;
  org_object_id: string;
  name: string;
  status?: string;
  reputation_score?: number;
  aor_admin: string;
}

