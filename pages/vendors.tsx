"use client";

import { useState } from "react";
import { useZkLoginSession } from "@shinami/nextjs-zklogin/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { AUTH_API_BASE } from "@shinami/nextjs-zklogin";
import type { VendorListItem, InviteNetworkResponseData } from "@/lib/shared/interfaces";

export default function VendorsPage() {
  const { user, isLoading: sessionLoading } = useZkLoginSession();
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();

  // Récupérer la liste des vendors
  const {
    data: vendors,
    isLoading: isLoadingVendors,
    error: vendorsError,
  } = useQuery<VendorListItem[]>({
    queryKey: ["vendors"],
    queryFn: async () => {
      if (!user?.wallet) throw new Error("User not authenticated");
      const res = await fetch("/api/vendors");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch vendors: ${res.status}`);
      }
      return res.json();
    },
    enabled: !!user,
  });

  // Mutation pour créer une invitation
  const inviteMutation = useMutation<InviteNetworkResponseData, Error, string>({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/invite/network", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to send invitation: ${res.status}`);
      }
      return res.json() as Promise<InviteNetworkResponseData>;
    },
    onSuccess: () => {
      setEmail("");
      // Rafraîchir la liste des vendors
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      alert("Veuillez entrer un email");
      return;
    }
    inviteMutation.mutate(email.trim());
  };

  if (sessionLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h1>Vendor Management</h1>
        <p style={{ marginTop: "1rem", marginBottom: "2rem" }}>
          Vous devez être connecté pour accéder à cette page.
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

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: "bold" }}>Vendor Management</h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>
            Gérez vos invitations et vos vendors
          </p>
        </div>
        <div>
          <Link
            href="/aor-dashboard"
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
            Dashboard
          </Link>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              backgroundColor: "#6c757d",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              marginRight: "0.5rem",
            }}
          >
            Accueil
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

      {/* Section: Invite New Vendor */}
      <div
        style={{
          marginBottom: "2rem",
          padding: "1.5rem",
          backgroundColor: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.25rem", fontWeight: "bold" }}>
          Invite New Vendor
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="vendor-email" style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
              Email du vendor
            </label>
            <input
              id="vendor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lab@lagos-test.com"
              required
              disabled={inviteMutation.isPending}
              style={{
                width: "100%",
                padding: "0.75rem",
                fontSize: "1rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="submit"
              disabled={inviteMutation.isPending || !email.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1rem",
                backgroundColor: inviteMutation.isPending || !email.trim() ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: inviteMutation.isPending || !email.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {inviteMutation.isPending ? "Envoi..." : "Send Invitation"}
            </button>
          </div>
        </form>

        {/* Messages de succès/erreur */}
        {inviteMutation.isSuccess && inviteMutation.data && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: inviteMutation.data.email_sent ? "#d4edda" : "#fff3cd",
              border: `1px solid ${inviteMutation.data.email_sent ? "#c3e6cb" : "#ffc107"}`,
              borderRadius: "4px",
              color: inviteMutation.data.email_sent ? "#155724" : "#856404",
            }}
          >
            {inviteMutation.data.email_sent ? (
              <>
                <strong>✅ Succès !</strong> Invitation créée et email envoyé avec succès à {email || "l'email"}.
              </>
            ) : (
              <>
                <strong>⚠️ Invitation créée mais email non envoyé</strong>
                <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9em" }}>
                  L'invitation a été créée avec succès, mais l'email n'a pas pu être envoyé.
                  {inviteMutation.data.email_error && (
                    <span style={{ display: "block", marginTop: "0.25rem", fontStyle: "italic" }}>
                      Erreur: {inviteMutation.data.email_error}
                    </span>
                  )}
                </p>
                {inviteMutation.data.invite_url && (
                  <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "#f8f9fa", borderRadius: "4px" }}>
                    <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: "bold" }}>Lien d'invitation :</p>
                    <code style={{ fontSize: "0.75rem", wordBreak: "break-all", display: "block", marginTop: "0.25rem" }}>
                      {inviteMutation.data.invite_url}
                    </code>
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.8em", color: "#666" }}>
                      Vous pouvez copier ce lien et l'envoyer manuellement au vendor.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {inviteMutation.isError && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "4px",
              color: "#721c24",
            }}
          >
            <strong>❌ Erreur :</strong>{" "}
            {inviteMutation.error instanceof Error
              ? inviteMutation.error.message
              : "Une erreur est survenue lors de l'envoi de l'invitation"}
          </div>
        )}
      </div>

      {/* Section: Vendors List */}
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
          Vendors List
        </h2>

        {isLoadingVendors ? (
          <div style={{ padding: "2rem", textAlign: "center" }}>
            <p>Chargement des vendors...</p>
          </div>
        ) : vendorsError ? (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "4px",
              color: "#721c24",
            }}
          >
            <strong>Erreur :</strong>{" "}
            {vendorsError instanceof Error
              ? vendorsError.message
              : "Impossible de charger la liste des vendors"}
            <p style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
              ⚠️ L'API <code>/api/vendors</code> n'est pas encore créée. Créez-la pour voir les vendors.
            </p>
          </div>
        ) : !vendors || vendors.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
            <p>Aucun vendor pour le moment.</p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.9em" }}>
              Invitez un vendor en utilisant le formulaire ci-dessus.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "1rem",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "bold",
                      borderBottom: "2px solid #dee2e6",
                    }}
                  >
                    Vendor Name
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "bold",
                      borderBottom: "2px solid #dee2e6",
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "bold",
                      borderBottom: "2px solid #dee2e6",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "0.75rem",
                      textAlign: "left",
                      fontWeight: "bold",
                      borderBottom: "2px solid #dee2e6",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    style={{
                      borderBottom: "1px solid #dee2e6",
                    }}
                  >
                    <td style={{ padding: "0.75rem" }}>
                      <strong>{vendor.name || "(Pending)"}</strong>
                    </td>
                    <td style={{ padding: "0.75rem" }}>{vendor.email}</td>
                    <td style={{ padding: "0.75rem" }}>
                      {vendor.status === "Active" ? (
                        <span style={{ color: "#28a745", fontWeight: "bold" }}>✅ Active</span>
                      ) : vendor.status === "Invited" ? (
                        <span style={{ color: "#ffc107", fontWeight: "bold" }}>✉️ Invited</span>
                      ) : (
                        <span style={{ color: "#6c757d" }}>Inactive</span>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {vendor.status === "Active" ? (
                        <button
                          style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#0070f3",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                          onClick={() => {
                            // TODO: Implémenter la vue du profil
                            alert("View Profile - À implémenter");
                          }}
                        >
                          View Profile
                        </button>
                      ) : (
                        <button
                          style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#ffc107",
                            color: "#000",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                          onClick={() => {
                            // TODO: Implémenter le renvoi d'invitation
                            alert("Resend Invitation - À implémenter");
                          }}
                        >
                          Resend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

