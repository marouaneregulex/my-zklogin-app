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
