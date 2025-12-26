/// Module: registry
/// Registre global pour enregistrer un AoR (Address of Record) une seule fois
module smartcontract::registry {
    use sui::event;

    /// Registre global partagé
    public struct GlobalRegistry has key, store {
        id: sui::object::UID,
        aor_admin: std::option::Option<address>,
        aor_name: std::option::Option<vector<u8>>,
    }

    /// Événement émis lors de l'enregistrement d'un AoR
    public struct AoRRegistered has copy, drop, store {
        admin: address,
        name: vector<u8>,
    }

    /// Exécuté automatiquement au publish : crée un GlobalRegistry partagé
    fun init(ctx: &mut sui::tx_context::TxContext) {
        let reg = GlobalRegistry {
            id: sui::object::new(ctx),
            aor_admin: std::option::none<address>(),
            aor_name: std::option::none<vector<u8>>(),
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
}

