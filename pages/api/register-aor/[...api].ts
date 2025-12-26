import { TANZANITE_PACKAGE_ID } from "@/lib/api/move";
import { gas, sui } from "@/lib/api/shinami";
import {
  RegisterAoRRequest,
  RegisterAoRResponse,
  RegisterAoRResult,
} from "@/lib/shared/interfaces";
import { first } from "@/lib/shared/utils";
import { buildGaslessTransaction } from "@shinami/clients/sui";
import {
  GaslessTransactionBuilder,
  InvalidRequest,
  TransactionResponseParser,
  zkLoginSponsoredTxExecHandler,
} from "@shinami/nextjs-zklogin/server/pages";
import { mask, validate } from "superstruct";

/**
 * Construit une transaction pour enregistrer un AoR dans le registre global
 */
const buildTx: GaslessTransactionBuilder = async (req, { wallet }) => {
  const [error, body] = validate(req.body, RegisterAoRRequest);
  if (error) throw new InvalidRequest(error.message);

  console.log("Preparing register_aor tx for zkLogin wallet", wallet);

  // Il faut d'abord obtenir l'ID du GlobalRegistry créé lors du publish
  // Pour l'instant, on suppose qu'il existe. En production, vous devrez le stocker.
  const GLOBAL_REGISTRY_ID = process.env.GLOBAL_REGISTRY_ID;
  if (!GLOBAL_REGISTRY_ID) {
    throw new InvalidRequest("GLOBAL_REGISTRY_ID not configured. Deploy the contract first.");
  }

  // Vérifier que l'objet existe et est partagé
  try {
    const registryObject = await sui.getObject({
      id: GLOBAL_REGISTRY_ID,
      options: { showOwner: true },
    });

    if (!registryObject.data) {
      throw new InvalidRequest(`GlobalRegistry object not found: ${GLOBAL_REGISTRY_ID}`);
    }

    const owner = registryObject.data.owner;
    if (!owner || typeof owner !== "object" || !("Shared" in owner)) {
      throw new InvalidRequest(`Object ${GLOBAL_REGISTRY_ID} is not a shared object`);
    }
  } catch (error) {
    if (error instanceof InvalidRequest) {
      throw error;
    }
    throw new InvalidRequest(`Failed to verify GlobalRegistry object: ${error instanceof Error ? error.message : String(error)}`);
  }

  return await buildGaslessTransaction(
    (txb) => {
      // Convertir le nom en vector<u8>
      const nameBytes = Array.from(new TextEncoder().encode(body.name));

      txb.moveCall({
        target: `${TANZANITE_PACKAGE_ID}::registry::register_aor`,
        arguments: [
          txb.object(GLOBAL_REGISTRY_ID), // L'objet GlobalRegistry partagé
          txb.pure.vector("u8", nameBytes), // Le nom en bytes
        ],
      });
    },
    { sui } // Passer le client Sui dans les options pour récupérer l'objet partagé
  );
};

/**
 * Parse la réponse de la transaction pour extraire les données de l'événement
 */
const parseTxRes: TransactionResponseParser<RegisterAoRResponse> = (_, txRes) => {
  // Chercher l'événement AoRRegistered
  const event = txRes.events?.find(
    (e) => e.type?.includes("AoRRegistered")
  );
  
  if (!event) {
    throw new Error("AoRRegistered event missing from tx response");
  }

  // Parser l'événement
  const result = mask(event.parsedJson, RegisterAoRResult);
  return { ...result, txDigest: txRes.digest };
};

/**
 * API route pour enregistrer un AoR dans le registre global
 * Nécessite une session zkLogin active
 */
export default zkLoginSponsoredTxExecHandler(sui, gas, buildTx, parseTxRes, {
  showEvents: true,
});

