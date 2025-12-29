"use client";

import { getSuiVisionAccountUrl, getSuiVisionObjectUrl } from "@/lib/hooks/sui";
import { AUTH_API_BASE } from "@shinami/nextjs-zklogin";
import { useZkLoginSession } from "@shinami/nextjs-zklogin/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

/**
 * Dashboard AoR - Affiche toutes les informations du compte et du registre
 */
interface RegistryStatus {
  isRegistered: boolean;
  admin: string | null;
  name: string | null;
  registryId: string;
}

export default function AoRDashboard() {
  const { user, isLoading: sessionLoading } = useZkLoginSession();

  // Récupérer l'état du registre
  const { data: registryStatus, isLoading: isLoadingStatus } = useQuery<RegistryStatus>({
    queryKey: ["registry-status"],
    queryFn: async () => {
      const resp = await fetch("/api/registry-status");
      if (resp.status !== 200) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch registry status. ${resp.status}`);
      }
      return resp.json();
    },
  });

  const isAdmin = user && registryStatus?.admin ? user.wallet.toLowerCase() === registryStatus.admin.toLowerCase() : false;

  if (sessionLoading || isLoadingStatus) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Chargement du dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h1>Dashboard AoR</h1>
        <p style={{ marginTop: "1rem", marginBottom: "2rem" }}>
          Vous devez être connecté pour accéder au dashboard.
        </p>
        <Link
          href="/auth/login"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            backgroundColor: "#0070f3",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Se connecter
        </Link>
      </div>
    );
  }

  const isRegistered = registryStatus?.isRegistered ?? false;

  // Si aucun AoR n'est enregistré, afficher un message
  if (!isRegistered) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h1>Dashboard AoR</h1>
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            backgroundColor: "#d1ecf1",
            border: "2px solid #bee5eb",
            borderRadius: "8px",
          }}
        >
          <p style={{ margin: 0, color: "#0c5460" }}>
            Aucun AoR n'a été enregistré dans le registre global.
          </p>
        </div>
        <div style={{ marginTop: "2rem" }}>
          <Link
            href="/registry"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#0070f3",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              marginRight: "1rem",
            }}
          >
            Enregistrer un AoR
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#6c757d",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>Dashboard AoR</h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>
            Tableau de bord de l'Authority of Record
          </p>
        </div>
        <div>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              backgroundColor: "#f0f0f0",
              color: "#333",
              textDecoration: "none",
              borderRadius: "4px",
              marginRight: "0.5rem",
            }}
          >
            Accueil
          </Link>
          <Link
            href="/registry"
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              backgroundColor: "#0070f3",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              marginRight: "0.5rem",
            }}
          >
            Registre
          </Link>
          <Link
            href={`${AUTH_API_BASE}/logout`}
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              backgroundColor: "#ff4444",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            Déconnexion
          </Link>
        </div>
      </div>

      {/* Grid Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* Carte: Informations du compte */}
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "bold" }}>
            📱 Informations du compte
          </h2>
          <div style={{ marginTop: "1rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#666", fontWeight: "bold" }}>
                Provider d'authentification
              </p>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "1rem", textTransform: "capitalize" }}>
                {user.oidProvider}
              </p>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "#666", fontWeight: "bold" }}>
                Adresse du wallet
              </p>
              <code
                style={{
                  fontSize: "0.875rem",
                  wordBreak: "break-all",
                  display: "block",
                  padding: "0.5rem",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "4px",
                  marginTop: "0.25rem",
                }}
              >
                {user.wallet}
              </code>
            </div>
            <div style={{ marginTop: "1rem" }}>
              <Link
                href={getSuiVisionAccountUrl(user.wallet)}
                target="_blank"
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#0070f3",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                }}
              >
                Voir sur SuiVision →
              </Link>
            </div>
          </div>
        </div>

        {/* Carte: Statut du registre */}
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: isRegistered ? "#e8f5e9" : "#fff3cd",
            border: `2px solid ${isRegistered ? "#4caf50" : "#ffc107"}`,
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "bold" }}>
            {isRegistered ? "✅ Registre actif" : "⚠️ Registre non enregistré"}
          </h2>
          <div style={{ marginTop: "1rem" }}>
            {isRegistered && registryStatus ? (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#666", fontWeight: "bold" }}>
                    Nom de l'AoR
                  </p>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "1.25rem", fontWeight: "bold", color: "#2e7d32" }}>
                    {registryStatus.name || "N/A"}
                  </p>
                </div>
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#666", fontWeight: "bold" }}>
                    Admin du registre
                  </p>
                  <code
                    style={{
                      fontSize: "0.75rem",
                      wordBreak: "break-all",
                      display: "block",
                      padding: "0.5rem",
                      backgroundColor: "white",
                      borderRadius: "4px",
                      marginTop: "0.25rem",
                    }}
                  >
                    {registryStatus.admin}
                  </code>
                </div>
                {isAdmin && (
                  <div
                    style={{
                      padding: "0.75rem",
                      backgroundColor: "#2e7d32",
                      color: "white",
                      borderRadius: "4px",
                      marginTop: "1rem",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    👑 Vous êtes l'administrateur
                  </div>
                )}
              </>
            ) : (
              <div>
                <p style={{ margin: 0, color: "#856404" }}>
                  Aucun AoR n'a été enregistré dans le registre global.
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <Link
                    href="/registry"
                    style={{
                      display: "inline-block",
                      padding: "0.5rem 1rem",
                      backgroundColor: "#0070f3",
                      color: "white",
                      textDecoration: "none",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                    }}
                  >
                    Enregistrer un AoR →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Carte: Informations du registre */}
        {isRegistered && registryStatus && (
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "bold" }}>
              🔗 Informations du registre
            </h2>
            <div style={{ marginTop: "1rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#666", fontWeight: "bold" }}>
                  ID du registre global
                </p>
                <code
                  style={{
                    fontSize: "0.75rem",
                    wordBreak: "break-all",
                    display: "block",
                    padding: "0.5rem",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    marginTop: "0.25rem",
                  }}
                >
                  {registryStatus.registryId}
                </code>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <Link
                  href={getSuiVisionObjectUrl(registryStatus.registryId)}
                  target="_blank"
                  style={{
                    display: "inline-block",
                    padding: "0.5rem 1rem",
                    backgroundColor: "#0070f3",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                  }}
                >
                  Voir l'objet sur SuiVision →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section: Actions rapides */}
      <div
        style={{
          padding: "1.5rem",
          backgroundColor: "#f8f9fa",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "bold" }}>
          ⚡ Actions rapides
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link
            href="/vendors"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#28a745",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            Gérer les vendors
          </Link>
          <Link
            href="/registry"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#0070f3",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            Gérer le registre
          </Link>
          <Link
            href={getSuiVisionAccountUrl(user.wallet)}
            target="_blank"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#28a745",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
            }}
          >
            Voir mon wallet sur SuiVision
          </Link>
          {isRegistered && registryStatus && (
            <Link
              href={getSuiVisionObjectUrl(registryStatus.registryId)}
              target="_blank"
              style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#17a2b8",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
              }}
            >
              Voir le registre sur SuiVision
            </Link>
          )}
        </div>
      </div>

      {/* Section: Statut de connexion */}
      <div
        style={{
          padding: "1.5rem",
          backgroundColor: "#e8f4f8",
          border: "1px solid #bee5eb",
          borderRadius: "8px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "bold" }}>
          🔐 Statut de connexion
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#666", fontWeight: "bold" }}>
              Authentifié via
            </p>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "1rem", textTransform: "capitalize" }}>
              {user.oidProvider}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#666", fontWeight: "bold" }}>
              Wallet connecté
            </p>
            <p
              style={{
                margin: "0.25rem 0 0 0",
                fontSize: "0.875rem",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {user.wallet.substring(0, 10)}...{user.wallet.substring(user.wallet.length - 8)}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#666", fontWeight: "bold" }}>
              Statut
            </p>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "1rem", color: "#28a745", fontWeight: "bold" }}>
              ✅ Connecté
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
