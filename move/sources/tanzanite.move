/// Module: registry
/// Registre global pour enregistrer un AoR (Address of Record) et créer des entreprises
module smartcontract::registry {
    use sui::event;

    /// Registre global partagé
    public struct GlobalRegistry has key, store {
        id: UID,
        aor_admin: std::option::Option<address>,
        aor_name: std::option::Option<vector<u8>>,
        company_id: std::option::Option<ID>,  // ID de l'entreprise créée par l'AoR (une seule)
    }

    /// Entreprise créée par un AoR
    public struct Company has key, store {
        id: UID,
        name: vector<u8>,              // Nom de l'entreprise
        country: vector<u8>,           // Pays
        authority_link: vector<u8>,   // Lien d'autorité
        aor_admin: address,            // L'AoR propriétaire
        badge_id: ID,                   // ID du badge public
        created_at: u64,               // Timestamp
    }

    /// Badge public de l'entreprise (shared object - accessible à tous)
    public struct CompanyBadge has key {
        id: UID,
        company_name: vector<u8>,      // Nom de l'entreprise (pour affichage public)
        badge_number: vector<u8>,      // Numéro unique du badge
        aor_admin: address,            // L'AoR propriétaire
        issued_at: u64,                 // Date d'émission
    }

    /// Événement émis lors de l'enregistrement d'un AoR
    public struct AoRRegistered has copy, drop, store {
        admin: address,
        name: vector<u8>,
    }

    /// Événement émis lors de la création d'une entreprise
    public struct CompanyCreated has copy, drop, store {
        company_id: ID,
        badge_id: ID,
        aor_admin: address,
        company_name: vector<u8>,
        badge_number: vector<u8>,
    }

    /// Exécuté automatiquement au publish : crée un GlobalRegistry partagé
    fun init(ctx: &mut sui::tx_context::TxContext) {
        let reg = GlobalRegistry {
            id: sui::object::new(ctx),
            aor_admin: std::option::none<address>(),
            aor_name: std::option::none<vector<u8>>(),
            company_id: std::option::none<ID>(),
        };
        sui::transfer::share_object(reg);
    }

    /// Genesis : enregistre le premier AoR (une seule fois)
    /// - name: Le nom de l'AoR à enregistrer
    /// - Retourne une erreur si un AoR est déjà enregistré
    public entry fun register_aor(reg: &mut GlobalRegistry, name: vector<u8>, ctx: &mut sui::tx_context::TxContext) {
        assert!(std::option::is_none(&reg.aor_admin), 1); // Si déjà créé => fail
        let sender = sui::tx_context::sender(ctx); // Adresse qui signe (zkLogin dans votre cas)
        reg.aor_admin = std::option::some(sender);
        reg.aor_name = std::option::some(name);
        event::emit(AoRRegistered { admin: sender, name });
    }

    /// Fonction pour lire l'admin actuel (si enregistré)
    public fun get_admin(reg: &GlobalRegistry): std::option::Option<address> {
        reg.aor_admin
    }

    /// Fonction pour lire le nom actuel (si enregistré)
    public fun get_name(reg: &GlobalRegistry): std::option::Option<vector<u8>> {
        reg.aor_name
    }

    /// Fonction pour lire l'ID de l'entreprise (si créée)
    public fun get_company_id(reg: &GlobalRegistry): std::option::Option<ID> {
        reg.company_id
    }

    /// Crée une entreprise et son badge public
    /// Seul l'AoR enregistré peut créer une entreprise
    /// Une seule entreprise par AoR
    public entry fun create_company(
        reg: &mut GlobalRegistry,
        name: vector<u8>,
        country: vector<u8>,
        authority_link: vector<u8>,
        ctx: &mut sui::tx_context::TxContext
    ) {
        // Vérifier qu'un AoR est enregistré
        let aor_admin_opt = reg.aor_admin;
        assert!(std::option::is_some(&aor_admin_opt), 2); // Erreur si aucun AoR
        
        let aor_admin = *std::option::borrow(&aor_admin_opt);
        let sender = sui::tx_context::sender(ctx);
        
        // Vérifier que le sender est bien l'AoR admin
        assert!(sender == aor_admin, 3); // Erreur si ce n'est pas l'AoR
        
        // Vérifier qu'aucune entreprise n'a déjà été créée pour cet AoR
        assert!(std::option::is_none(&reg.company_id), 4); // Erreur si une entreprise existe déjà
        
        let timestamp = sui::tx_context::epoch_timestamp_ms(ctx);
        
        // Créer un badge_number unique (utilise le timestamp comme base)
        // Format simplifié: "BADGE-" + timestamp
        let mut badge_number = std::vector::empty<u8>();
        std::vector::append(&mut badge_number, b"BADGE-");
        // Convertir le timestamp en string (simplifié)
        let timestamp_bytes = std::bcs::to_bytes(&timestamp);
        std::vector::append(&mut badge_number, timestamp_bytes);
        
        // Créer le badge public (shared object) - accessible à tous
        let badge = CompanyBadge {
            id: sui::object::new(ctx),
            company_name: name,
            badge_number,
            aor_admin: sender,
            issued_at: timestamp,
        };
        let badge_id = sui::object::id(&badge);
        
        // Rendre le badge public (shared object)
        sui::transfer::share_object(badge);
        
        // Créer l'entreprise (owned object par l'AoR)
        let company = Company {
            id: sui::object::new(ctx),
            name,
            country,
            authority_link,
            aor_admin: sender,
            badge_id,
            created_at: timestamp,
        };
        let company_id = sui::object::id(&company);
        
        // Enregistrer l'ID de l'entreprise dans le registre
        reg.company_id = std::option::some(company_id);
        
        // Transférer l'entreprise à l'AoR
        sui::transfer::transfer(company, sender);
        
        // Émettre l'événement (utiliser badge_number directement car c'est une copie)
        event::emit(CompanyCreated {
            company_id,
            badge_id,
            aor_admin: sender,
            company_name: name,
            badge_number,
        });
    }

    /// Fonction pour lire les informations d'une entreprise
    public fun get_company_info(company: &Company): (vector<u8>, vector<u8>, vector<u8>, address, ID) {
        (
            company.name,
            company.country,
            company.authority_link,
            company.aor_admin,
            company.badge_id
        )
    }

    /// Fonction pour lire les informations d'un badge (public)
    public fun get_badge_info(badge: &CompanyBadge): (vector<u8>, vector<u8>, address, u64) {
        (
            badge.company_name,
            badge.badge_number,
            badge.aor_admin,
            badge.issued_at
        )
    }
}

