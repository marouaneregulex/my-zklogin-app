"use client";

import { useRegisterAoRMutation } from "@/lib/hooks/api";
import { getSuiVisionTransactionUrl } from "@/lib/hooks/sui";
import { useZkLoginSession } from "@shinami/nextjs-zklogin/client";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

/**
 * Page pour enregistrer un AoR dans le registre global
 * Nécessite une authentification zkLogin
 */
interface RegistryStatus {
  isRegistered: boolean;
  admin: string | null;
  name: string | null;
  registryId: string;
}

export default function RegistryPage() {
  const { user, isLoading: sessionLoading, localSession } = useZkLoginSession();
  const [name, setName] = useState("");
  const registerMutation = useRegisterAoRMutation();

  // Récupérer l'état actuel du registre
  const { data: registryStatus, isLoading: isLoadingStatus, refetch } = useQuery<RegistryStatus>({
    queryKey: ["registry-status"],
    queryFn: async () => {
      const resp = await fetch("/api/registry-status");
      if (resp.status !== 200) {
        throw new Error(`Failed to fetch registry status. ${resp.status}`);
      }
      return resp.json();
    },
  });

  // Rafraîchir l'état après un enregistrement réussi
  useEffect(() => {
    if (registerMutation.isSuccess) {
      void refetch();
    }
  }, [registerMutation.isSuccess, refetch]);

  if (sessionLoading || isLoadingStatus) {
    return <p>Chargement...</p>;
  }

  if (!user) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
        <h1>Registre AoR</h1>
        <p>Vous devez être connecté pour enregistrer un AoR.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Veuillez entrer un nom");
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        name: name.trim(),
        keyPair: localSession.ephemeralKeyPair,
      });
      alert(`AoR enregistré avec succès !\nAdmin: ${result.admin}\nNom: ${result.name}`);
      setName("");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert(
        error instanceof Error
          ? `Erreur: ${error.message}`
          : "Une erreur est survenue"
      );
    }
  };

  const isAlreadyRegistered = registryStatus?.isRegistered ?? false;

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      {/* Header avec navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>Registre Global AoR</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link
            href="/aor-dashboard"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#28a745",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            📊 Dashboard
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
              fontSize: "1rem",
            }}
          >
            Accueil
          </Link>
        </div>
      </div>

      {/* Afficher l'état actuel du registre */}
      {isAlreadyRegistered && registryStatus && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            backgroundColor: "#e8f5e9",
            border: "2px solid #4caf50",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#2e7d32" }}>✅ AoR Déjà Enregistré</h2>
          <div style={{ marginTop: "1rem" }}>
            <p>
              <strong>Admin:</strong> <code>{registryStatus.admin}</code>
            </p>
            <p>
              <strong>Nom de l'AoR:</strong> <strong>{registryStatus.name}</strong>
            </p>
            
            {/* Indiquer si l'utilisateur actuel est l'admin */}
            {user.wallet.toLowerCase() === registryStatus.admin?.toLowerCase() ? (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "4px",
                }}
              >
                <p style={{ margin: 0, color: "#856404" }}>
                  <strong>👑 Vous êtes l'admin de ce registre !</strong>
                </p>
              </div>
            ) : (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  backgroundColor: "#f8d7da",
                  border: "1px solid #dc3545",
                  borderRadius: "4px",
                }}
              >
                <p style={{ margin: 0, color: "#721c24" }}>
                  <strong>⚠️ Vous n'êtes pas l'admin de ce registre.</strong>
                </p>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em", color: "#721c24" }}>
                  L'admin est une autre adresse. Avec zkLogin, chaque session génère une adresse unique.
                </p>
              </div>
            )}
            
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                backgroundColor: "#d1ecf1",
                border: "1px solid #bee5eb",
                borderRadius: "4px",
              }}
            >
              <p style={{ margin: 0, fontSize: "0.9em", color: "#0c5460" }}>
                <strong>ℹ️ Pourquoi les adresses sont différentes ?</strong>
              </p>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85em", color: "#0c5460" }}>
                Avec zkLogin, chaque compte OAuth (Google, Facebook, etc.) génère une adresse Sui unique.
                L'adresse dépend de votre identité OAuth et d'un salt aléatoire. Si vous vous connectez avec
                un compte différent ou à un moment différent, vous aurez une adresse différente.
              </p>
            </div>
            
            <p style={{ marginTop: "1rem", fontSize: "0.9em", color: "#666" }}>
              ⚠️ Un AoR a déjà été enregistré dans ce registre. Cette opération ne peut être effectuée qu'une seule fois.
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: isAlreadyRegistered ? "#f5f5f5" : "#f5f5f5",
          borderRadius: "8px",
          opacity: isAlreadyRegistered ? 0.6 : 1,
        }}
      >
        <h2>Enregistrer un AoR</h2>
        <p style={{ marginTop: "0.5rem", color: "#666" }}>
          Cette action enregistre le premier AoR dans le registre global.
          <strong> Cette opération ne peut être effectuée qu'une seule fois.</strong>
        </p>

        <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
          <div>
            <label
              htmlFor="aor-name"
              style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}
            >
              Nom de l'AoR:
            </label>
            <input
              id="aor-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrez le nom de l'AoR"
              disabled={registerMutation.isPending}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending || !name.trim() || isAlreadyRegistered}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: isAlreadyRegistered || registerMutation.isPending ? "#ccc" : "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isAlreadyRegistered || registerMutation.isPending ? "not-allowed" : "pointer",
            }}
          >
            {isAlreadyRegistered
              ? "Déjà Enregistré"
              : registerMutation.isPending
              ? "Enregistrement..."
              : "Enregistrer AoR"}
          </button>
        </form>

        {registerMutation.isError && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "4px",
            }}
          >
            <p style={{ margin: 0, color: "#c00" }}>
              <strong>Erreur:</strong>{" "}
              {registerMutation.error instanceof Error
                ? registerMutation.error.message
                : "Une erreur est survenue"}
            </p>
          </div>
        )}

        {registerMutation.isSuccess && registerMutation.data && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#efe",
              border: "1px solid #cfc",
              borderRadius: "4px",
            }}
          >
            <p style={{ margin: 0, color: "#060" }}>
              <strong>✅ AoR enregistré avec succès !</strong>
            </p>
            <div style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
              <p>
                <strong>Admin:</strong> <code>{registerMutation.data.admin}</code>
              </p>
              <p>
                <strong>Nom:</strong> {registerMutation.data.name}
              </p>
              <p>
                <strong>Transaction:</strong>{" "}
                <a
                  href={getSuiVisionTransactionUrl(registerMutation.data.txDigest)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#0070f3", textDecoration: "underline" }}
                >
                  Voir sur SuiVision →
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: "#e8f4f8",
          borderRadius: "8px",
        }}
      >
        <h2>Informations</h2>
        <div style={{ marginTop: "1rem" }}>
          <p>
            <strong>Wallet connecté:</strong> <code>{user.wallet}</code>
          </p>
          <p>
            <strong>Provider:</strong> {user.oidProvider}
          </p>
        </div>
      </div>
    </div>
  );
}

