import { TANZANITE_PACKAGE_ID } from "@/lib/api/move";
import { sui } from "@/lib/api/shinami";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * API route pour obtenir l'état actuel du GlobalRegistry
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const GLOBAL_REGISTRY_ID = process.env.GLOBAL_REGISTRY_ID;
    if (!GLOBAL_REGISTRY_ID) {
      res.status(500).json({
        error: "GLOBAL_REGISTRY_ID not configured",
      });
      return;
    }

    // Récupérer l'objet GlobalRegistry depuis la blockchain
    const registryObject = await sui.getObject({
      id: GLOBAL_REGISTRY_ID,
      options: {
        showContent: true,
        showOwner: true,
      },
    });

    if (!registryObject.data) {
      res.status(404).json({
        error: "GlobalRegistry object not found",
      });
      return;
    }

    const content = registryObject.data.content;
    if (!content || content.dataType !== "moveObject") {
      res.status(500).json({
        error: "Invalid GlobalRegistry object format",
      });
      return;
    }

    const fields = content.fields as {
      aor_admin?: string | { vec: string[] } | null;
      aor_name?: number[] | { vec: number[] } | null;
      company_id?: string | { id: string } | { vec: string[] } | null;
      id?: { id: string };
    };

    // Vérifier si un AoR est déjà enregistré
    let adminValue: string | null = null;
    if (fields.aor_admin) {
      if (typeof fields.aor_admin === "string") {
        adminValue = fields.aor_admin;
      } else if (fields.aor_admin.vec && fields.aor_admin.vec.length > 0) {
        adminValue = fields.aor_admin.vec[0];
      }
    }

    const isRegistered = adminValue !== null && adminValue !== "";

    let admin: string | null = null;
    let name: string | null = null;

    if (isRegistered) {
      admin = adminValue;
      // aor_name peut être un array direct ou un objet avec vec
      let nameBytes: number[] | null = null;
      if (fields.aor_name) {
        if (Array.isArray(fields.aor_name)) {
          nameBytes = fields.aor_name;
        } else if (fields.aor_name.vec) {
          nameBytes = fields.aor_name.vec;
        }
      }
      if (nameBytes && nameBytes.length > 0) {
        // Convertir le vector<u8> en string
        name = new TextDecoder().decode(new Uint8Array(nameBytes));
      }

      res.status(200).json({
        isRegistered: true,
        admin,
        name,
        registryId: GLOBAL_REGISTRY_ID,
      });
      return;
    }

    // Aucun AoR enregistré
    res.status(200).json({
      isRegistered: false,
      admin: null,
      name: null,
      registryId: GLOBAL_REGISTRY_ID,
      companyId: null,
    });
  } catch (error) {
    console.error("Error in registry-status handler:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to fetch registry status",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
