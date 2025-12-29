import { Infer, array, coerce, integer, object, string } from "superstruct";

// Interfaces pour le smart contract tanzanite (registre AoR)
export const RegisterAoRRequest = object({
  name: string(),
});
export type RegisterAoRRequest = Infer<typeof RegisterAoRRequest>;

export const RegisterAoRResult = object({
  admin: string(),
  name: coerce(
    string(),
    array(integer()),
    (value) => {
      // Convertir le tableau de bytes (vector<u8>) en string
      if (Array.isArray(value)) {
        return new TextDecoder().decode(new Uint8Array(value))
;
      }
      return String(value);
    }
  ),
});
export type RegisterAoRResult = Infer<typeof RegisterAoRResult>;

export const RegisterAoRResponse = object({
  ...RegisterAoRResult.schema,
  txDigest: string(),
});
export type RegisterAoRResponse = Infer<typeof RegisterAoRResponse>;

// Interfaces pour les invitations de vendors
export const InviteNetworkRequest = object({
  email: string(),
});
export type InviteNetworkRequest = Infer<typeof InviteNetworkRequest>;

// Interface pour la réponse d'invitation réseau
export interface InviteNetworkResponseData {
  success: boolean;
  message: string;
  invite_id: string;
  email_sent: boolean;
  email_error: string | null;
  invite_url: string;
}

// Interface pour un vendor dans la liste
export interface VendorListItem {
  id: string;
  email: string;
  name: string | null;
  status: "Invited" | "Active" | "Inactive";
  org_object_id: string | null;
  invite_id?: string;
}
