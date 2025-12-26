import { sui } from "@/lib/api/shinami";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * API route pour obtenir l'entreprise d'un AoR
 * Récupère l'objet Company owned par l'AoR
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const aorAddress = req.query.address as string;
  if (!aorAddress) {
    res.status(400).json({ error: "Address parameter is required" });
    return;
  }

  try {
    const packageId = process.env.NEXT_PUBLIC_TANZANITE_PACKAGE_ID;
    if (!packageId) {
      return res.status(500).json({
        error: "NEXT_PUBLIC_TANZANITE_PACKAGE_ID not configured",
      });
    }

    const GLOBAL_REGISTRY_ID = process.env.GLOBAL_REGISTRY_ID;
    if (!GLOBAL_REGISTRY_ID) {
      return res.status(500).json({
        error: "GLOBAL_REGISTRY_ID not configured",
      });
    }

    // D'abord, vérifier le GlobalRegistry pour voir si une entreprise existe
    try {
      const registryObject = await sui.getObject({
        id: GLOBAL_REGISTRY_ID,
        options: {
          showContent: true,
        },
      });

      if (registryObject.data && registryObject.data.content && registryObject.data.content.dataType === "moveObject") {
        const registryFields = registryObject.data.content.fields as {
          company_id?: string | { id: string } | { vec: string[] } | null;
        };

        let companyId: string | null = null;
        if (registryFields.company_id) {
          if (typeof registryFields.company_id === "string") {
            companyId = registryFields.company_id;
          } else if (typeof registryFields.company_id === "object") {
            if ("id" in registryFields.company_id) {
              companyId = registryFields.company_id.id;
            } else if ("vec" in registryFields.company_id && registryFields.company_id.vec && registryFields.company_id.vec.length > 0) {
              companyId = registryFields.company_id.vec[0];
            }
          }
        }

        // Si une entreprise existe dans le registre, la récupérer directement
        if (companyId) {
          console.log("Found company_id in GlobalRegistry:", companyId);
          try {
            const companyObject = await sui.getObject({
              id: companyId,
              options: {
                showContent: true,
                showType: true,
                showOwner: true,
              },
            });

            if (companyObject.data && companyObject.data.content && companyObject.data.content.dataType === "moveObject") {
              // Vérifier que l'entreprise appartient bien à cet AoR
              const owner = companyObject.data.owner;
              if (owner && typeof owner === "object" && "AddressOwner" in owner) {
                if (owner.AddressOwner.toLowerCase() === aorAddress.toLowerCase()) {
                  console.log("Company belongs to this AoR, parsing...");
                  // Parser l'entreprise (code réutilisé ci-dessous)
                  const content = companyObject.data.content;
                  const fields = content.fields as {
                    name?: number[] | { vec: number[] } | null;
                    country?: number[] | { vec: number[] } | null;
                    authority_link?: number[] | { vec: number[] } | null;
                    aor_admin?: string;
                    badge_id?: string | { id: string };
                    created_at?: string;
                    id?: { id: string };
                  };

                  let name: string | null = null;
                  let country: string | null = null;
                  let authority_link: string | null = null;
                  
                  // badge_id peut être une string directe ou un objet { id: string }
                  let badge_id: string | null = null;
                  if (fields.badge_id) {
                    if (typeof fields.badge_id === "string") {
                      badge_id = fields.badge_id;
                    } else if (typeof fields.badge_id === "object" && "id" in fields.badge_id) {
                      badge_id = fields.badge_id.id;
                    }
                  }
                  
                  const company_id = fields.id?.id || companyId;

                  // Parser les champs (code réutilisé)
                  if (fields.name) {
                    let nameBytes: number[] | null = null;
                    if (Array.isArray(fields.name)) {
                      nameBytes = fields.name;
                    } else if (fields.name.vec) {
                      nameBytes = fields.name.vec;
                    }
                    if (nameBytes && nameBytes.length > 0) {
                      name = new TextDecoder().decode(new Uint8Array(nameBytes));
                    }
                  }

                  if (fields.country) {
                    let countryBytes: number[] | null = null;
                    if (Array.isArray(fields.country)) {
                      countryBytes = fields.country;
                    } else if (fields.country.vec) {
                      countryBytes = fields.country.vec;
                    }
                    if (countryBytes && countryBytes.length > 0) {
                      country = new TextDecoder().decode(new Uint8Array(countryBytes));
                    }
                  }

                  if (fields.authority_link) {
                    let linkBytes: number[] | null = null;
                    if (Array.isArray(fields.authority_link)) {
                      linkBytes = fields.authority_link;
                    } else if (fields.authority_link.vec) {
                      linkBytes = fields.authority_link.vec;
                    }
                    if (linkBytes && linkBytes.length > 0) {
                      authority_link = new TextDecoder().decode(new Uint8Array(linkBytes));
                    }
                  }

                  // Récupérer le badge
                  let badge = null;
                  if (badge_id) {
                    try {
                      const badgeObject = await sui.getObject({
                        id: badge_id,
                        options: {
                          showContent: true,
                          showOwner: true,
                        },
                      });

                      if (badgeObject.data && badgeObject.data.content && badgeObject.data.content.dataType === "moveObject") {
                        const badgeFields = badgeObject.data.content.fields as {
                          company_name?: number[] | { vec: number[] } | null;
                          badge_number?: number[] | { vec: number[] } | null;
                          aor_admin?: string;
                          issued_at?: string;
                        };

                        let badgeName: string | null = null;
                        let badgeNumber: string | null = null;

                        if (badgeFields.company_name) {
                          let nameBytes: number[] | null = null;
                          if (Array.isArray(badgeFields.company_name)) {
                            nameBytes = badgeFields.company_name;
                          } else if (badgeFields.company_name.vec) {
                            nameBytes = badgeFields.company_name.vec;
                          }
                          if (nameBytes && nameBytes.length > 0) {
                            badgeName = new TextDecoder().decode(new Uint8Array(nameBytes));
                          }
                        }

                        if (badgeFields.badge_number) {
                          let numberBytes: number[] | null = null;
                          if (Array.isArray(badgeFields.badge_number)) {
                            numberBytes = badgeFields.badge_number;
                          } else if (badgeFields.badge_number.vec) {
                            numberBytes = badgeFields.badge_number.vec;
                          }
                          if (numberBytes && numberBytes.length > 0) {
                            badgeNumber = new TextDecoder().decode(new Uint8Array(numberBytes));
                          }
                        }

                        badge = {
                          id: badge_id,
                          company_name: badgeName,
                          badge_number: badgeNumber,
                          aor_admin: badgeFields.aor_admin,
                          issued_at: badgeFields.issued_at,
                        };
                      }
                    } catch (error) {
                      console.error("Error fetching badge:", error);
                    }
                  }

                  return res.status(200).json({
                    hasCompany: true,
                    company: {
                      id: company_id,
                      name,
                      country,
                      authority_link,
                      aor_admin: fields.aor_admin,
                      badge_id,
                      created_at: fields.created_at,
                    },
                    badge,
                  });
                }
              }
            }
          } catch (error) {
            console.error("Error fetching Company by ID from registry:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching GlobalRegistry:", error);
    }

    const structType = `${packageId}::registry::Company`;
    console.log("Searching for Company with structType:", structType);
    console.log("Owner address:", aorAddress);

    // Récupérer tous les objets owned par l'AoR
    const ownedObjects = await sui.getOwnedObjects({
      owner: aorAddress,
      filter: {
        StructType: structType,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    console.log("Found objects:", ownedObjects.data?.length || 0);
    if (ownedObjects.data && ownedObjects.data.length > 0) {
      console.log("First object type:", ownedObjects.data[0].data?.type);
    }

    if (!ownedObjects.data || ownedObjects.data.length === 0) {
      // Essayer de trouver l'entreprise via les événements CompanyCreated
      console.log("No Company found via getOwnedObjects, trying events...");
      
      try {
        const packageId = process.env.NEXT_PUBLIC_TANZANITE_PACKAGE_ID;
        const eventType = `${packageId}::registry::CompanyCreated`;
        
        const events = await sui.queryEvents({
          query: {
            MoveEventType: eventType,
          },
          order: "descending",
          limit: 10,
        });

        console.log("Found CompanyCreated events:", events.data?.length || 0);

        // Chercher l'événement pour cet AoR
        const aorEvent = events.data?.find((event) => {
          const parsedJson = event.parsedJson as any;
          return parsedJson?.aor_admin?.toLowerCase() === aorAddress.toLowerCase();
        });

        if (aorEvent && aorEvent.parsedJson) {
          const eventData = aorEvent.parsedJson as {
            company_id: string;
            badge_id: string;
            aor_admin: string;
            company_name: number[];
            badge_number: number[];
          };

          console.log("Found CompanyCreated event for this AoR, company_id:", eventData.company_id);

          // Récupérer l'objet Company directement par son ID
          try {
            const companyObject = await sui.getObject({
              id: eventData.company_id,
              options: {
                showContent: true,
                showType: true,
                showOwner: true,
              },
            });

            if (companyObject.data && companyObject.data.content && companyObject.data.content.dataType === "moveObject") {
              console.log("Successfully retrieved Company object");
              // Continuer avec le parsing normal...
              const content = companyObject.data.content;
              const fields = content.fields as {
                name?: number[] | { vec: number[] } | null;
                country?: number[] | { vec: number[] } | null;
                authority_link?: number[] | { vec: number[] } | null;
                aor_admin?: string;
                badge_id?: string | { id: string };
                created_at?: string;
                id?: { id: string };
              };

              // Parser les champs (code réutilisé)
              let name: string | null = null;
              let country: string | null = null;
              let authority_link: string | null = null;
              
              // badge_id peut être une string directe ou un objet { id: string }
              let badge_id: string | null = null;
              if (fields.badge_id) {
                if (typeof fields.badge_id === "string") {
                  badge_id = fields.badge_id;
                } else if (typeof fields.badge_id === "object" && "id" in fields.badge_id) {
                  badge_id = fields.badge_id.id;
                }
              }
              // Fallback sur eventData.badge_id si pas trouvé dans fields
              if (!badge_id && eventData.badge_id) {
                badge_id = eventData.badge_id;
              }
              
              const company_id = fields.id?.id || eventData.company_id;

              // Parser name
              if (fields.name) {
                let nameBytes: number[] | null = null;
                if (Array.isArray(fields.name)) {
                  nameBytes = fields.name;
                } else if (fields.name.vec) {
                  nameBytes = fields.name.vec;
                }
                if (nameBytes && nameBytes.length > 0) {
                  name = new TextDecoder().decode(new Uint8Array(nameBytes));
                }
              }

              // Parser country
              if (fields.country) {
                let countryBytes: number[] | null = null;
                if (Array.isArray(fields.country)) {
                  countryBytes = fields.country;
                } else if (fields.country.vec) {
                  countryBytes = fields.country.vec;
                }
                if (countryBytes && countryBytes.length > 0) {
                  country = new TextDecoder().decode(new Uint8Array(countryBytes));
                }
              }

              // Parser authority_link
              if (fields.authority_link) {
                let linkBytes: number[] | null = null;
                if (Array.isArray(fields.authority_link)) {
                  linkBytes = fields.authority_link;
                } else if (fields.authority_link.vec) {
                  linkBytes = fields.authority_link.vec;
                }
                if (linkBytes && linkBytes.length > 0) {
                  authority_link = new TextDecoder().decode(new Uint8Array(linkBytes));
                }
              }

              // Récupérer le badge
              let badge = null;
              if (badge_id) {
                try {
                  const badgeObject = await sui.getObject({
                    id: badge_id,
                    options: {
                      showContent: true,
                      showOwner: true,
                    },
                  });

                  if (badgeObject.data && badgeObject.data.content && badgeObject.data.content.dataType === "moveObject") {
                    const badgeFields = badgeObject.data.content.fields as {
                      company_name?: number[] | { vec: number[] } | null;
                      badge_number?: number[] | { vec: number[] } | null;
                      aor_admin?: string;
                      issued_at?: string;
                    };

                    let badgeName: string | null = null;
                    let badgeNumber: string | null = null;

                    if (badgeFields.company_name) {
                      let nameBytes: number[] | null = null;
                      if (Array.isArray(badgeFields.company_name)) {
                        nameBytes = badgeFields.company_name;
                      } else if (badgeFields.company_name.vec) {
                        nameBytes = badgeFields.company_name.vec;
                      }
                      if (nameBytes && nameBytes.length > 0) {
                        badgeName = new TextDecoder().decode(new Uint8Array(nameBytes));
                      }
                    }

                    if (badgeFields.badge_number) {
                      let numberBytes: number[] | null = null;
                      if (Array.isArray(badgeFields.badge_number)) {
                        numberBytes = badgeFields.badge_number;
                      } else if (badgeFields.badge_number.vec) {
                        numberBytes = badgeFields.badge_number.vec;
                      }
                      if (numberBytes && numberBytes.length > 0) {
                        badgeNumber = new TextDecoder().decode(new Uint8Array(numberBytes));
                      }
                    }

                    badge = {
                      id: badge_id,
                      company_name: badgeName,
                      badge_number: badgeNumber,
                      aor_admin: badgeFields.aor_admin,
                      issued_at: badgeFields.issued_at,
                    };
                  }
                } catch (error) {
                  console.error("Error fetching badge:", error);
                }
              }

              return res.status(200).json({
                hasCompany: true,
                company: {
                  id: company_id,
                  name,
                  country,
                  authority_link,
                  aor_admin: fields.aor_admin,
                  badge_id,
                  created_at: fields.created_at,
                },
                badge,
              });
            }
          } catch (error) {
            console.error("Error fetching Company object by ID:", error);
          }
        }
      } catch (error) {
        console.error("Error querying events:", error);
      }

      // Essayer sans filtre pour voir tous les objets
      const allObjects = await sui.getOwnedObjects({
        owner: aorAddress,
        options: {
          showContent: true,
          showType: true,
        },
      });
      console.log("Total owned objects:", allObjects.data?.length || 0);
      if (allObjects.data && allObjects.data.length > 0) {
        console.log("Sample object types:", allObjects.data.slice(0, 3).map(obj => obj.data?.type));
      }

      return res.status(200).json({
        hasCompany: false,
        company: null,
        badge: null,
      });
    }

    // Prendre la première entreprise (il ne devrait y en avoir qu'une)
    console.log("Processing found Company object...");
    const companyObject = ownedObjects.data[0];
    if (!companyObject.data || !companyObject.data.content) {
      console.log("Company object has no data or content");
      return res.status(200).json({
        hasCompany: false,
        company: null,
        badge: null,
      });
    }

    const content = companyObject.data.content;
    if (content.dataType !== "moveObject") {
      console.log("Company object is not a moveObject, type:", content.dataType);
      return res.status(500).json({
        error: "Invalid Company object format",
      });
    }

    console.log("Company object content found, parsing fields...");

    const fields = content.fields as {
      name?: number[] | { vec: number[] } | null;
      country?: number[] | { vec: number[] } | null;
      authority_link?: number[] | { vec: number[] } | null;
      aor_admin?: string;
      badge_id?: string | { id: string };
      created_at?: string;
      id?: { id: string };
    };

    console.log("Company fields:", JSON.stringify(fields, null, 2));
    console.log("badge_id field:", fields.badge_id, "type:", typeof fields.badge_id);

    // Parser les champs
    let name: string | null = null;
    let country: string | null = null;
    let authority_link: string | null = null;
    
    // badge_id peut être une string directe ou un objet { id: string }
    let badge_id: string | null = null;
    if (fields.badge_id) {
      if (typeof fields.badge_id === "string") {
        badge_id = fields.badge_id;
      } else if (typeof fields.badge_id === "object" && "id" in fields.badge_id) {
        badge_id = fields.badge_id.id;
      }
    }
    
    console.log("Parsed badge_id:", badge_id);
    
    const company_id = fields.id?.id || companyObject.data.objectId;

    // Parser name
    if (fields.name) {
      let nameBytes: number[] | null = null;
      if (Array.isArray(fields.name)) {
        nameBytes = fields.name;
      } else if (fields.name.vec) {
        nameBytes = fields.name.vec;
      }
      if (nameBytes && nameBytes.length > 0) {
        name = new TextDecoder().decode(new Uint8Array(nameBytes));
      }
    }

    // Parser country
    if (fields.country) {
      let countryBytes: number[] | null = null;
      if (Array.isArray(fields.country)) {
        countryBytes = fields.country;
      } else if (fields.country.vec) {
        countryBytes = fields.country.vec;
      }
      if (countryBytes && countryBytes.length > 0) {
        country = new TextDecoder().decode(new Uint8Array(countryBytes));
      }
    }

    // Parser authority_link
    if (fields.authority_link) {
      let linkBytes: number[] | null = null;
      if (Array.isArray(fields.authority_link)) {
        linkBytes = fields.authority_link;
      } else if (fields.authority_link.vec) {
        linkBytes = fields.authority_link.vec;
      }
      if (linkBytes && linkBytes.length > 0) {
        authority_link = new TextDecoder().decode(new Uint8Array(linkBytes));
      }
    }

    // Récupérer le badge (shared object)
    let badge = null;
    if (badge_id) {
      console.log("Fetching badge with ID:", badge_id);
      try {
        const badgeObject = await sui.getObject({
          id: badge_id,
          options: {
            showContent: true,
            showOwner: true,
          },
        });

        console.log("Badge object retrieved:", !!badgeObject.data);

        if (badgeObject.data && badgeObject.data.content && badgeObject.data.content.dataType === "moveObject") {
          console.log("Badge content found, parsing...");
          const badgeFields = badgeObject.data.content.fields as {
            company_name?: number[] | { vec: number[] } | null;
            badge_number?: number[] | { vec: number[] } | null;
            aor_admin?: string;
            issued_at?: string;
          };

          let badgeName: string | null = null;
          let badgeNumber: string | null = null;

          if (badgeFields.company_name) {
            let nameBytes: number[] | null = null;
            if (Array.isArray(badgeFields.company_name)) {
              nameBytes = badgeFields.company_name;
            } else if (badgeFields.company_name.vec) {
              nameBytes = badgeFields.company_name.vec;
            }
            if (nameBytes && nameBytes.length > 0) {
              badgeName = new TextDecoder().decode(new Uint8Array(nameBytes));
            }
          }

          if (badgeFields.badge_number) {
            let numberBytes: number[] | null = null;
            if (Array.isArray(badgeFields.badge_number)) {
              numberBytes = badgeFields.badge_number;
            } else if (badgeFields.badge_number.vec) {
              numberBytes = badgeFields.badge_number.vec;
            }
            if (numberBytes && numberBytes.length > 0) {
              badgeNumber = new TextDecoder().decode(new Uint8Array(numberBytes));
            }
          }

          badge = {
            id: badge_id,
            company_name: badgeName,
            badge_number: badgeNumber,
            aor_admin: badgeFields.aor_admin,
            issued_at: badgeFields.issued_at,
          };
          console.log("Badge parsed successfully:", { id: badge_id, name: badgeName, number: badgeNumber });
        } else {
          console.log("Badge object has no content or invalid format");
        }
      } catch (error) {
        console.error("Error fetching badge:", error);
        // Continue sans le badge si erreur
      }
    } else {
      console.log("No badge_id found in Company object");
    }
    
    console.log("Returning company status:", {
      hasCompany: true,
      companyId: company_id,
      badgeId: badge_id,
      hasBadge: !!badge,
    });

    return res.status(200).json({
      hasCompany: true,
      company: {
        id: company_id,
        name,
        country,
        authority_link,
        aor_admin: fields.aor_admin,
        badge_id,
        created_at: fields.created_at,
      },
      badge,
    });
  } catch (error) {
    console.error("Error fetching company status:", error);
    res.status(500).json({
      error: "Failed to fetch company status",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

