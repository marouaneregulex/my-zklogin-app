"use client";

import { useCreateCompanyMutation } from "@/lib/hooks/api";
import { getSuiVisionAccountUrl, getSuiVisionObjectUrl, getSuiVisionTransactionUrl } from "@/lib/hooks/sui";
import { AUTH_API_BASE } from "@shinami/nextjs-zklogin";
import { useZkLoginSession } from "@shinami/nextjs-zklogin/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useEffect } from "react";

/**
 * Dashboard AoR - Affiche toutes les informations du compte et du registre
 */
interface RegistryStatus {
  isRegistered: boolean;
  admin: string | null;
  name: string | null;
  registryId: string;
  companyId: string | null;
}

interface CompanyStatus {
  hasCompany: boolean;
  company: {
    id: string;
    name: string | null;
    country: string | null;
    authority_link: string | null;
    aor_admin: string;
    badge_id: string | null;
    created_at: string | null;
  } | null;
  badge: {
    id: string;
    company_name: string | null;
    badge_number: string | null;
    aor_admin: string;
    issued_at: string | null;
  } | null;
}

export default function AoRDashboard() {
  const { user, isLoading: sessionLoading, localSession } = useZkLoginSession();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyCountry, setCompanyCountry] = useState("");
  const [companyAuthorityLink, setCompanyAuthorityLink] = useState("");

  // Récupérer l'état du registre
  const { data: registryStatus, isLoading: isLoadingStatus, error: registryError } = useQuery<RegistryStatus>({
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

  // Récupérer l'état de l'entreprise (seulement si l'utilisateur est l'admin)
  const isAdmin = user && registryStatus?.admin ? user.wallet.toLowerCase() === registryStatus.admin.toLowerCase() : false;
  const { data: companyStatus, isLoading: isLoadingCompany, refetch: refetchCompany, error: companyError } = useQuery<CompanyStatus>({
    queryKey: ["company-status", user?.wallet],
    queryFn: async () => {
      if (!user?.wallet) throw new Error("No wallet address");
      const resp = await fetch(`/api/company-status?address=${user.wallet}`);
      if (resp.status !== 200) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch company status. ${resp.status}`);
      }
      const data = await resp.json();
      console.log("Company status response:", data);
      return data;
    },
    enabled: !!user && isAdmin,
  });

  // Mutation pour créer une entreprise
  const createCompanyMutation = useCreateCompanyMutation();

  // Réinitialiser le formulaire après succès
  useEffect(() => {
    if (createCompanyMutation.isSuccess) {
      setShowCreateForm(false);
      setCompanyName("");
      setCompanyCountry("");
      setCompanyAuthorityLink("");
      void refetchCompany();
    }
  }, [createCompanyMutation.isSuccess, refetchCompany]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !companyCountry.trim() || !companyAuthorityLink.trim()) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    if (!localSession?.ephemeralKeyPair) {
      alert("Session invalide");
      return;
    }

    try {
      await createCompanyMutation.mutateAsync({
        name: companyName.trim(),
        country: companyCountry.trim(),
        authority_link: companyAuthorityLink.trim(),
        keyPair: localSession.ephemeralKeyPair,
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'entreprise:", error);
    }
  };

  if (sessionLoading || isLoadingStatus || (isAdmin && isLoadingCompany)) {
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

      {/* Section: Entreprise et Badge (seulement pour l'admin) */}
      {isAdmin && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "bold" }}>
            🏢 Entreprise et Badge
          </h2>

          {companyStatus?.hasCompany && companyStatus.company ? (
            <div>
              <div
                style={{
                  padding: "1.5rem",
                  backgroundColor: "#e8f5e9",
                  border: "2px solid #4caf50",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                }}
              >
                <h3 style={{ marginTop: 0, color: "#2e7d32" }}>✅ Entreprise créée</h3>
                <div style={{ marginTop: "1rem" }}>
                  <p><strong>Nom:</strong> {companyStatus.company.name || "N/A"}</p>
                  <p><strong>Pays:</strong> {companyStatus.company.country || "N/A"}</p>
                  <p><strong>Lien d'autorité:</strong> <a href={companyStatus.company.authority_link || "#"} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3" }}>{companyStatus.company.authority_link || "N/A"}</a></p>
                </div>
              </div>

              {companyStatus.badge ? (
                <div
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#fff3cd",
                    border: "2px solid #ffc107",
                    borderRadius: "8px",
                  }}
                >
                  <h3 style={{ marginTop: 0, color: "#856404" }}>🏅 Badge Public</h3>
                  <div style={{ marginTop: "1rem" }}>
                    <p><strong>Numéro du badge:</strong> <code style={{ fontSize: "0.9em", padding: "0.25rem 0.5rem", backgroundColor: "#fff", borderRadius: "4px" }}>{companyStatus.badge.badge_number || "N/A"}</code></p>
                    <p><strong>Nom de l'entreprise:</strong> {companyStatus.badge.company_name || "N/A"}</p>
                    {companyStatus.company.badge_id && (
                      <div style={{ marginTop: "1rem" }}>
                        <Link
                          href={getSuiVisionObjectUrl(companyStatus.company.badge_id)}
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
                          Voir le badge sur SuiVision →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ) : companyStatus.company.badge_id ? (
                <div
                  style={{
                    padding: "1.5rem",
                    backgroundColor: "#fff3cd",
                    border: "2px solid #ffc107",
                    borderRadius: "8px",
                  }}
                >
                  <h3 style={{ marginTop: 0, color: "#856404" }}>🏅 Badge Public</h3>
                  <div style={{ marginTop: "1rem" }}>
                    <p style={{ color: "#856404" }}>Badge ID: <code>{companyStatus.company.badge_id}</code></p>
                    <div style={{ marginTop: "1rem" }}>
                      <Link
                        href={getSuiVisionObjectUrl(companyStatus.company.badge_id)}
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
                        Voir le badge sur SuiVision →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div>
              {!showCreateForm ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <p style={{ marginBottom: "1rem", color: "#666" }}>
                    Aucune entreprise n'a été créée pour cet AoR.
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    style={{
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#0070f3",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "1rem",
                    }}
                  >
                    Créer une entreprise
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateCompany} style={{ padding: "1.5rem", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <h3 style={{ marginTop: 0 }}>Créer une entreprise</h3>
                  <div style={{ marginBottom: "1rem" }}>
                    <label htmlFor="company-name" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                      Nom de l'entreprise *
                    </label>
                    <input
                      id="company-name"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        fontSize: "1rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label htmlFor="company-country" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                      Pays *
                    </label>
                    <input
                      id="company-country"
                      type="text"
                      value={companyCountry}
                      onChange={(e) => setCompanyCountry(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        fontSize: "1rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <label htmlFor="company-authority-link" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                      Lien d'autorité *
                    </label>
                    <input
                      id="company-authority-link"
                      type="url"
                      value={companyAuthorityLink}
                      onChange={(e) => setCompanyAuthorityLink(e.target.value)}
                      required
                      placeholder="https://..."
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        fontSize: "1rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                      type="submit"
                      disabled={createCompanyMutation.isPending}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: createCompanyMutation.isPending ? "#ccc" : "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: createCompanyMutation.isPending ? "not-allowed" : "pointer",
                        fontSize: "1rem",
                      }}
                    >
                      {createCompanyMutation.isPending ? "Création..." : "Créer l'entreprise"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setCompanyName("");
                        setCompanyCountry("");
                        setCompanyAuthorityLink("");
                      }}
                      style={{
                        padding: "0.75rem 1.5rem",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "1rem",
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                  {createCompanyMutation.isError && (
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
                        {createCompanyMutation.error instanceof Error
                          ? createCompanyMutation.error.message
                          : "Une erreur est survenue"}
                      </p>
                    </div>
                  )}
                  {createCompanyMutation.isSuccess && createCompanyMutation.data && (
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
                        <strong>✅ Entreprise créée avec succès !</strong>
                      </p>
                      <div style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
                        <p>
                          <strong>Badge ID:</strong> <code>{createCompanyMutation.data.badge_id}</code>
                        </p>
                        <p>
                          <strong>Transaction:</strong>{" "}
                          <a
                            href={getSuiVisionTransactionUrl(createCompanyMutation.data.txDigest)}
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
                </form>
              )}
            </div>
          )}
        </div>
      )}

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

