import type { NextApiRequest, NextApiResponse } from "next";
import { createInvite } from "@/lib/firebase/invites";
import crypto from "crypto";
import { getIronSession } from "iron-session";
import { sendNetworkInviteEmail } from "@/lib/email/sender";

/**
 * Récupère l'utilisateur zkLogin depuis la session
 * Utilise l'API /api/auth/me fournie par @shinami/nextjs-zklogin en interne
 */
async function getZkLoginUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    // @shinami/nextjs-zklogin fournit une API /api/auth/me
    // Nous pouvons l'appeler en interne en créant une requête simulée
    // avec les mêmes cookies que la requête originale
    
    // Créer une requête interne vers /api/auth/me
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const authMeUrl = `${baseUrl}/api/auth/me`;
    
    // Copier les cookies de la requête originale
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
          console.log("✅ Utilisateur récupéré via /api/auth/me:", { 
            wallet: userData.wallet, 
            provider: userData.oidProvider 
          });
          return {
            wallet: String(userData.wallet),
            oidProvider: String(userData.oidProvider || "unknown"),
          };
        }
      } else {
        console.log("❌ /api/auth/me a retourné:", response.status, response.statusText);
      }
    } catch (fetchError) {
      console.error("Erreur lors de l'appel à /api/auth/me:", fetchError);
      // Fallback: essayer de lire directement la session
    }
    
    // Fallback: essayer de lire directement la session avec iron-session
    // (au cas où l'appel fetch ne fonctionne pas en développement)
    const sessionOptions = {
      password: process.env.IRON_SESSION_SECRET ?? "",
      cookieName: "zklogin-session",
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax" as const,
      },
    };

    if (!process.env.IRON_SESSION_SECRET) {
      console.error("IRON_SESSION_SECRET n'est pas configuré");
      return null;
    }

    const session = await getIronSession(req, res, sessionOptions);
    const sessionData: any = session || {};
    const sessionKeys = Object.keys(sessionData).filter(key => !['destroy', 'save'].includes(key));
    
    if (sessionKeys.length > 0 && sessionData.user && typeof sessionData.user === "object" && "wallet" in sessionData.user) {
      console.log("✅ Utilisateur trouvé dans la session directe");
      return {
        wallet: String(sessionData.user.wallet),
        oidProvider: String(sessionData.user.oidProvider || "unknown"),
      };
    }
    
    console.log("❌ Aucun utilisateur trouvé");
    return null;
  } catch (error) {
    console.error("Error getting zkLogin session:", error);
    return null;
  }
}

/**
 * API pour créer une invitation réseau (network invite)
 * POST /api/invite/network
 * Body: { email: string }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Récupérer l'utilisateur zkLogin depuis la session
    const user = await getZkLoginUser(req, res);
    if (!user || !user.wallet) {
      return res.status(401).json({ error: "Non authentifié. Veuillez vous connecter." });
    }

    // 2. Récupérer l'email depuis le body
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email requis" });
    }

    // 3. Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Format d'email invalide" });
    }

    // 4. Vérifier que l'email n'est pas déjà invité (optionnel)
    // TODO: Implémenter cette vérification si nécessaire

    // 5. Générer un token unique et sécurisé
    const token = crypto.randomBytes(32).toString("hex");

    // 6. Calculer la date d'expiration (7 jours)
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    // 7. Construire l'URL d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/register-company?token=${token}`;
    
    // 8. ENVOYER L'EMAIL D'ABORD (pour tester l'envoi d'email indépendamment de Firebase)
    let emailSent = false;
    let emailError: string | null = null;
    let emailMessageId: string | undefined = undefined;
    
    try {
      const emailResult = await sendNetworkInviteEmail({
        email: email.toLowerCase(),
        inviteUrl,
        aorName: "Authority of Record", // TODO: Récupérer le nom de l'AoR depuis le registre
        expiresInDays: 7,
      });
      
      emailSent = emailResult.success;
      emailMessageId = emailResult.messageId;
      
      if (emailSent) {
        console.log(`✅ Email d'invitation envoyé à ${email} - Message ID: ${emailMessageId}`);
      } else {
        emailError = "Échec de l'envoi de l'email";
        console.error(`❌ Échec de l'envoi de l'email à ${email}`);
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Erreur inconnue lors de l'envoi de l'email";
      console.error("❌ Erreur lors de l'envoi de l'email:", err);
    }

    // 9. CRÉER L'INVITATION DANS FIRESTORE (seulement si l'email est envoyé avec succès)
    // Pour tester l'email sans Firebase, on peut ignorer cette partie
    let invite = null;
    let firestoreError: string | null = null;
    
    if (emailSent) {
      // Seulement créer dans Firestore si l'email est envoyé avec succès
      try {
        invite = await createInvite({
          email: email.toLowerCase(),
          token: token,
          aor_admin: user.wallet,
          expires_at: expiresAt,
        });
        console.log(`✅ Invitation créée dans Firestore avec l'ID: ${invite.id}`);
      } catch (err) {
        firestoreError = err instanceof Error ? err.message : String(err);
        console.error("❌ Erreur lors de la création de l'invitation dans Firestore:", err);
        // On continue même si Firestore échoue - l'email est déjà envoyé
      }
    }

    // 10. Retourner le résultat (focus sur l'email)
    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: invite 
          ? "Email envoyé avec succès et invitation créée dans Firestore" 
          : "Email envoyé avec succès mais erreur lors de la création dans Firestore",
        invite_id: invite?.id || null,
        email_sent: true,
        email_message_id: emailMessageId,
        email_error: null,
        invite_url: inviteUrl,
        firestore_error: firestoreError,
      });
    } else {
      // Email non envoyé - retourner l'erreur
      return res.status(400).json({
        success: false,
        message: "L'email n'a pas pu être envoyé",
        invite_id: null,
        email_sent: false,
        email_message_id: null,
        email_error: emailError,
        invite_url: inviteUrl, // Retourner l'URL quand même pour debug
        firestore_error: null,
      });
    }
  } catch (error) {
    console.error("Error creating invitation:", error);
    return res.status(500).json({
      error: "Erreur serveur lors de la création de l'invitation",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
