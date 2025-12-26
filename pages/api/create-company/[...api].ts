import { TANZANITE_PACKAGE_ID } from "@/lib/api/move";
import { gas, sui } from "@/lib/api/shinami";
import {
  CreateCompanyRequest,
  CreateCompanyResponse,
  CreateCompanyResult,
} from "@/lib/shared/interfaces";
import { buildGaslessTransaction } from "@shinami/clients/sui";
import {
  GaslessTransactionBuilder,
  InvalidRequest,
  TransactionResponseParser,
  zkLoginSponsoredTxExecHandler,
} from "@shinami/nextjs-zklogin/server/pages";
import { mask, validate } from "superstruct";

/**
 * Construit une transaction pour créer une entreprise et son badge
 */
const buildTx: GaslessTransactionBuilder = async (req, { wallet }) => {
  const [error, body] = validate(req.body, CreateCompanyRequest);
  if (error) throw new InvalidRequest(error.message);

  console.log("Preparing create_company tx for zkLogin wallet", wallet);

  const GLOBAL_REGISTRY_ID = process.env.GLOBAL_REGISTRY_ID;
  if (!GLOBAL_REGISTRY_ID) {
    throw new InvalidRequest("GLOBAL_REGISTRY_ID not configured. Deploy the contract first.");
  }

  // Vérifier que le GlobalRegistry existe et est partagé
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
      const nameBytes = Array.from(new TextEncoder().encode(body.name));
      const countryBytes = Array.from(new TextEncoder().encode(body.country));
      const authorityLinkBytes = Array.from(new TextEncoder().encode(body.authority_link));

      txb.moveCall({
        target: `${TANZANITE_PACKAGE_ID}::registry::create_company`,
        arguments: [
          txb.object(GLOBAL_REGISTRY_ID),
          txb.pure.vector("u8", nameBytes),
          txb.pure.vector("u8", countryBytes),
          txb.pure.vector("u8", authorityLinkBytes),
        ],
      });
    },
    { sui }
  );
};

const parseTxRes: TransactionResponseParser<CreateCompanyResponse> = (_, txRes) => {
  const event = txRes.events?.find(
    (e) => e.type?.includes("CompanyCreated")
  );

  if (!event) {
    throw new Error("CompanyCreated event missing from tx response");
  }

  const result = mask(event.parsedJson, CreateCompanyResult);
  return { ...result, txDigest: txRes.digest };
};

/**
 * API route pour créer une entreprise
 * Nécessite une session zkLogin active et que l'utilisateur soit l'AoR
 */
export default zkLoginSponsoredTxExecHandler(sui, gas, buildTx, parseTxRes, {
  showEvents: true,
});

