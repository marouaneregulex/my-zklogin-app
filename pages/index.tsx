"use client";

import { getSuiVisionAccountUrl } from "@/lib/hooks/sui";
import { AUTH_API_BASE, LOGIN_PAGE_PATH } from "@shinami/nextjs-zklogin";
import { useZkLoginSession } from "@shinami/nextjs-zklogin/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

// This is a publically accessible page, displaying optional contents for signed-in users.
interface RegistryStatus {
  isRegistered: boolean;
  admin: string | null;
  name: string | null;
  registryId: string;
}

export default function Index() {
  const { user, isLoading } = useZkLoginSession();

  // Récupérer l'état du registre
  const { data: registryStatus, isLoading: isLoadingStatus } = useQuery<RegistryStatus>({
    queryKey: ["registry-status"],
    queryFn: async () => {
      const resp = await fetch("/api/registry-status");
      if (resp.status !== 200) {
        throw new Error(`Failed to fetch registry status. ${resp.status}`);
      }
      return resp.json();
    },
    enabled: !!user, // Seulement si l'utilisateur est connecté
  });

  if (isLoading || (user && isLoadingStatus)) {
    return <p>Chargement...</p>;
  }

  if (user) {

    // Signed-in experience - Première connexion (pas d'AoR créé)
    return (
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
        <h1>Hello, {user.oidProvider} user! 👋</h1>
        
        <div style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
          <h2>Informations du compte</h2>
          <div style={{ marginTop: "1rem" }}>
            <p><strong>Provider:</strong> {user.oidProvider}</p>
            <p><strong>Wallet Address:</strong> <code style={{ fontSize: "0.9em", wordBreak: "break-all" }}>{user.wallet}</code></p>
          </div>
        </div>

        <div style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: "#e8f4f8", borderRadius: "8px" }}>
          <h2>Wallet Sui (zkLogin)</h2>
          <div style={{ marginTop: "1rem" }}>
            <p><strong>Adresse du wallet:</strong></p>
            <p>
              <code style={{ fontSize: "0.9em", wordBreak: "break-all", display: "block", padding: "0.5rem", backgroundColor: "white", borderRadius: "4px" }}>
                {user.wallet}
              </code>
            </p>
            <div style={{ marginTop: "1rem" }}>
              <Link 
                href={getSuiVisionAccountUrl(user.wallet)} 
                target="_blank"
                style={{ color: "#0070f3", textDecoration: "underline" }}
              >
                Voir sur SuiVision →
              </Link>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link 
            href="/aor-dashboard"
            style={{ 
              display: "inline-block", 
              padding: "0.75rem 1.5rem", 
              backgroundColor: "#28a745", 
              color: "white", 
              textDecoration: "none", 
              borderRadius: "4px"
            }}
          >
            Dashboard AoR
          </Link>
          {/* Afficher le bouton seulement si aucun AoR n'est enregistré ET que le statut est chargé */}
          {!isLoadingStatus && !registryStatus?.isRegistered && (
            <Link 
              href="/registry"
              style={{ 
                display: "inline-block", 
                padding: "0.75rem 1.5rem", 
                backgroundColor: "#0070f3", 
                color: "white", 
                textDecoration: "none", 
                borderRadius: "4px"
              }}
            >
              Enregistrer un AoR
            </Link>
          )}
        </div>

        <div style={{ marginTop: "2rem" }}>
          <Link 
            href={`${AUTH_API_BASE}/logout`}
            style={{ 
              display: "inline-block", 
              padding: "0.75rem 1.5rem", 
              backgroundColor: "#ff4444", 
              color: "white", 
              textDecoration: "none", 
              borderRadius: "4px" 
            }}
          >
            Se déconnecter
          </Link>
        </div>
      </div>
    );
  } else {
    // Anonymous experience.
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Hello, anonymous user! 👋</h1>
        <p style={{ marginTop: "1rem", marginBottom: "2rem" }}>
          Connectez-vous pour créer votre wallet Sui avec zkLogin
        </p>
        <Link 
          href={LOGIN_PAGE_PATH}
          style={{ 
            display: "inline-block", 
            padding: "0.75rem 1.5rem", 
            backgroundColor: "#0070f3", 
            color: "white", 
            textDecoration: "none", 
            borderRadius: "4px" 
          }}
        >
          Se connecter avec Google
        </Link>
      </div>
    );
  }
}
