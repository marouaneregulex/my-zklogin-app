import type { NextApiRequest, NextApiResponse } from "next";
import { findInvitesByAoR } from "@/lib/firebase/invites";
import { findVendorsByAoR } from "@/lib/firebase/vendors";
import type { VendorListItem } from "@/lib/shared/interfaces";

/**
 * Récupère l'utilisateur zkLogin depuis la session
 * Utilise l'API /api/auth/me fournie par @shinami/nextjs-zklogin
 */
async function getZkLoginUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Utiliser l'API /api/auth/me fournie par @shinami/nextjs-zklogin
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const authMeUrl = `${baseUrl}/api/auth/me`;
    const cookies = req.headers.cookie || "";
    
    try {
      const response = await fetch(authMeUrl, {
        method: "GET",
        headers: {
          "Cookie": cookies,
          "User-Agent": req.headers["user-agent"] || "Next.js Internal",
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData && userData.wallet) {
          return {
            wallet: String(userData.wallet),
            oidProvider: String(userData.oidProvider || "unknown"),
          };
        }
      }
    } catch (fetchError) {
      console.error("Erreur lors de l'appel à /api/auth/me:", fetchError);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting zkLogin session:", error);
    return null;
  }
}

/**
 * API pour récupérer la liste des vendors et invitations d'un AoR
 * GET /api/vendors
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Récupérer l'utilisateur zkLogin depuis la session
    const user = await getZkLoginUser(req, res);
    if (!user || !user.wallet) {
      return res.status(401).json({ error: "Non authentifié. Veuillez vous connecter." });
    }

    // 2. Récupérer toutes les invitations de cet AoR
    const invites = await findInvitesByAoR(user.wallet);

    // 3. Récupérer tous les vendors de cet AoR
    const vendors = await findVendorsByAoR(user.wallet);

    // 4. Combiner les invitations et vendors en une seule liste
    const vendorList: VendorListItem[] = [];

    // Ajouter les invitations en attente
    for (const invite of invites) {
      if (invite.status === "Invited") {
        vendorList.push({
          id: invite.id,
          email: invite.email,
          name: null,
          status: "Invited",
          org_object_id: null,
          invite_id: invite.id,
        });
      }
    }

    // Ajouter les vendors actifs
    for (const vendor of vendors) {
      vendorList.push({
        id: vendor.id,
        email: vendor.email,
        name: vendor.name,
        status: vendor.status as "Active" | "Inactive",
        org_object_id: vendor.org_object_id,
        invite_id: vendor.invite_id,
      });
    }

    // 5. Trier par date de création (les plus récents en premier)
    vendorList.sort((a, b) => {
      // Les invitations en attente en premier, puis les actifs
      if (a.status === "Invited" && b.status === "Active") return -1;
      if (a.status === "Active" && b.status === "Invited") return 1;
      return 0;
    });

    // 6. Retourner la liste
    return res.status(200).json(vendorList);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return res.status(500).json({
      error: "Erreur serveur lors de la récupération des vendors",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

