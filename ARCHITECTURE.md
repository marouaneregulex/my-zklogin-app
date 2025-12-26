# Architecture du Projet - my-zklogin-app

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Générale](#architecture-générale)
3. [Frontend (Client-side)](#frontend-client-side)
4. [Backend (Server-side)](#backend-server-side)
5. [Code Partagé](#code-partagé)
6. [Smart Contracts](#smart-contracts)
7. [Flux de Données](#flux-de-données)
8. [Sécurité](#sécurité)
9. [Variables d'Environnement](#variables-denvironnement)

---

## 🎯 Vue d'ensemble

Ce projet est une application **Next.js** qui utilise **zkLogin** pour l'authentification et les transactions Sui. Il combine :
- **Frontend React** : Interface utilisateur dans le navigateur
- **Backend API** : Routes API Next.js sur le serveur
- **Smart Contracts Sui** : Contrats Move déployés sur la blockchain

### Technologies Principales

- **Next.js 16** : Framework React avec SSR/SSG
- **zkLogin** : Authentification sans clé privée via OAuth
- **Sui Blockchain** : Blockchain pour les smart contracts
- **Shinami Services** : Infrastructure pour Sui (Node, Gas Station, Wallet, Prover)
- **TypeScript** : Typage statique
- **React Query** : Gestion d'état et cache des requêtes

---

## 🏗️ Architecture Générale

```
my-zklogin-app/
│
├── 📱 FRONTEND (Client-side - Navigateur)
│   ├── pages/              # Pages React (UI)
│   │   ├── _app.tsx        # Configuration globale
│   │   ├── index.tsx       # Page d'accueil
│   │   ├── registry.tsx    # Page principale
│   │   └── auth/           # Pages OAuth
│   │
│   └── lib/hooks/          # Hooks React personnalisés
│
├── 🔧 BACKEND (Server-side - Serveur Node.js)
│   └── pages/api/          # Routes API Next.js
│       ├── auth/            # Authentification
│       ├── register-aor/    # API Tanzanite
│       └── registry-status/ # API statut
│
├── 🔗 CODE PARTAGÉ
│   └── lib/
│       ├── api/            # Clients API (utilisés par backend)
│       └── shared/         # Types, interfaces, utils
│
└── 📦 SMART CONTRACTS
    └── move/               # Smart contracts Sui Move
        └── sources/
            └── tanzanite.move
```

---

## 📱 Frontend (Client-side)

### Emplacement
- **Dossier** : `pages/*.tsx` (sauf `pages/api/`)
- **Exécution** : Navigateur de l'utilisateur
- **Technologie** : React + TypeScript

### Fichiers Frontend

#### `pages/_app.tsx`
**Rôle** : Configuration globale de l'application Next.js

**Fonctionnalités** :
- Enveloppe toutes les pages de l'application
- Configure les providers React :
  - `QueryClientProvider` : Gestion du cache et des requêtes
  - `ZkLoginSessionProvider` : Gestion de la session zkLogin côté client
- Styles globaux (si nécessaire)

**Code** :
```typescript
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ZkLoginSessionProvider>
        <Component {...pageProps} />
      </ZkLoginSessionProvider>
    </QueryClientProvider>
  );
}
```

#### `pages/index.tsx`
**Rôle** : Page d'accueil publique

**Fonctionnalités** :
- Affiche un message pour les utilisateurs anonymes
- Affiche les informations du compte pour les utilisateurs connectés
- Lien vers `/registry` (page Tanzanite)
- Bouton de déconnexion

**Flux** :
1. Vérifie si l'utilisateur est connecté via `useZkLoginSession()`
2. Affiche l'interface appropriée (anonyme ou connecté)
3. Redirige vers `/auth/login` si l'utilisateur veut se connecter

#### `pages/registry.tsx`
**Rôle** : Page principale pour interagir avec le smart contract Tanzanite

**Fonctionnalités** :
- Affiche l'état actuel du registre (AoR enregistré ou non)
- Formulaire pour enregistrer un AoR (une seule fois)
- Indique si l'utilisateur actuel est l'admin
- Affiche les informations du wallet connecté

**Hooks utilisés** :
- `useZkLoginSession()` : Session zkLogin
- `useRegisterAoRMutation()` : Mutation pour enregistrer un AoR
- `useQuery()` : Récupération de l'état du registre

**Flux** :
1. Charge l'état du registre via `/api/registry-status`
2. Affiche les informations (admin, nom, état)
3. Permet l'enregistrement si aucun AoR n'est enregistré
4. Désactive le formulaire si déjà enregistré

#### `pages/auth/` - Pages d'Authentification

##### `pages/auth/login.tsx`
**Rôle** : Page de connexion principale

**Fonctionnalités** :
- Liste les providers OAuth disponibles (Google, Facebook, etc.)
- Redirige vers le provider sélectionné
- Gère les erreurs de connexion

##### `pages/auth/google.tsx`
**Rôle** : Callback Google OAuth

**Fonctionnalités** :
- Reçoit le callback de Google après authentification
- Affiche le statut (loggingIn, error, success)
- Redirige automatiquement après succès

**Autres callbacks** : `facebook.tsx`, `apple.tsx`, `twitch.tsx` (même principe)

### Hooks Frontend (`lib/hooks/`)

#### `lib/hooks/api.ts`
**Rôle** : Hooks React Query pour les appels API

**Exports** :

##### `useRegisterAoRMutation()`
**Type** : `UseMutationResult<RegisterAoRResponse, ApiError, RegisterAoRRequest & WithKeyPair>`

**Fonctionnalités** :
- Gère la mutation complète pour enregistrer un AoR
- Utilise `apiTxExecMutationFn` qui gère automatiquement :
  1. Appel à `/api/register-aor/tx` (construction de la transaction)
  2. Signature avec l'ephemeral key pair côté client
  3. Appel à `/api/register-aor/exec` (exécution de la transaction)
- Retourne l'état de la mutation (loading, error, success, data)

**Utilisation** :
```typescript
const registerMutation = useRegisterAoRMutation();

await registerMutation.mutateAsync({
  name: "mon-aor",
  keyPair: localSession.ephemeralKeyPair
});
```

#### `lib/hooks/sui.ts`
**Rôle** : Hooks et utilitaires Sui pour le frontend

**Fonctions** :
- `getSuiVisionAccountUrl(address)` : Génère l'URL SuiVision pour un compte
- `getSuiVisionTransactionUrl(digest)` : Génère l'URL SuiVision pour une transaction
- `getSuiVisionObjectUrl(objectId)` : Génère l'URL SuiVision pour un objet

---

## 🔧 Backend (Server-side)

### Emplacement
- **Dossier** : `pages/api/*.ts`
- **Exécution** : Serveur Node.js (Next.js API Routes)
- **Technologie** : Next.js API Routes + TypeScript

### Routes API Backend

#### `pages/api/auth/[...api].ts`
**Rôle** : Gestion complète de l'authentification zkLogin

**Routes gérées** :
- `GET /api/auth/login` : Démarre le processus OAuth
- `GET /api/auth/callback` : Reçoit le callback OAuth
- `POST /api/auth/logout` : Déconnecte l'utilisateur
- `GET /api/auth/me` : Retourne les informations de l'utilisateur connecté

**Fonctionnalités** :
- Utilise `authHandler` de `@shinami/nextjs-zklogin/server/pages`
- Gère les providers OAuth (Google, Facebook, Apple, Twitch)
- Crée et gère la session zkLogin
- Stocke les données sensibles dans des cookies HTTP-only chiffrés

**Sécurité** :
- Cookies HTTP-only (non accessibles depuis JavaScript)
- Chiffrement avec `IRON_SESSION_SECRET`
- Validation des tokens OAuth

**Flux d'authentification** :
1. Utilisateur clique sur "Se connecter" → `/api/auth/login?provider=google`
2. Redirection vers Google OAuth
3. Google redirige vers `/auth/google` (callback)
4. Le callback appelle `/api/auth/callback`
5. Création de la session zkLogin
6. Stockage dans les cookies
7. Redirection vers la page d'accueil

#### `pages/api/register-aor/[...api].ts`
**Rôle** : API pour enregistrer un AoR dans le registre Tanzanite

**Routes gérées** :
- `POST /api/register-aor/tx` : Construit la transaction Sui
- `POST /api/register-aor/exec` : Exécute la transaction signée

**Fonctionnalités** :

##### `buildTx` : Construction de la transaction
1. Valide la requête (`RegisterAoRRequest`)
2. Vérifie que `GLOBAL_REGISTRY_ID` est configuré
3. Vérifie que l'objet GlobalRegistry existe et est partagé
4. Convertit le nom en `vector<u8>` (bytes)
5. Construit la transaction Sui avec `buildGaslessTransaction`
6. Appelle `register_aor` sur le smart contract

##### `parseTxRes` : Parsing de la réponse
1. Cherche l'événement `AoRRegistered` dans la réponse
2. Parse l'événement (admin, name)
3. Convertit le `name` (bytes) en string
4. Retourne la réponse avec le digest de la transaction

**Sécurité** :
- Requiert une session zkLogin active (`zkLoginSponsoredTxExecHandler`)
- Validation des données d'entrée
- Vérification de l'existence de l'objet partagé

**Flux complet** :
1. Client appelle `/api/register-aor/tx` avec `{ name: "..." }`
2. Backend construit la transaction
3. Client signe la transaction avec l'ephemeral key pair
4. Client appelle `/api/register-aor/exec` avec la signature
5. Backend assemble la signature zkLogin complète
6. Backend exécute la transaction via Gas Station (sponsorisée)
7. Backend parse la réponse et retourne les données

#### `pages/api/registry-status.ts`
**Rôle** : API pour vérifier l'état actuel du registre

**Route** : `GET /api/registry-status`

**Fonctionnalités** :
1. Récupère l'objet `GlobalRegistry` depuis la blockchain
2. Lit les champs `aor_admin` et `aor_name`
3. Convertit `aor_name` (bytes) en string
4. Retourne l'état (isRegistered, admin, name)

**Réponse** :
```typescript
{
  isRegistered: boolean;
  admin: string | null;
  name: string | null;
  registryId: string;
}
```

**Utilisation** :
- Appelé par le frontend pour afficher l'état du registre
- Pas d'authentification requise (lecture seule)

### Clients Backend (`lib/api/`)

#### `lib/api/shinami.ts`
**Rôle** : Configuration des clients Shinami pour le backend

**Clients exportés** :

##### `sui` : Client Sui
- **Type** : `SuiClient`
- **Utilisation** : Interactions avec la blockchain Sui
- **Accès** : Backend uniquement (utilise `SHINAMI_SUPER_ACCESS_KEY`)
- **Fonctions** : `getObject()`, `queryTransactionBlocks()`, etc.

##### `gas` : Client Gas Station
- **Type** : `GasStationClient`
- **Utilisation** : Sponsorisation des transactions (gasless)
- **Accès** : Backend uniquement

##### `zkw` : Client ZkWallet
- **Type** : `ZkWalletClient`
- **Utilisation** : Gestion des wallets zkLogin
- **Accès** : Backend uniquement

##### `zkp` : Client ZkProver
- **Type** : `ZkProverClient`
- **Utilisation** : Génération des preuves zkLogin
- **Accès** : Backend uniquement

**Sécurité** :
- Utilise `SHINAMI_SUPER_ACCESS_KEY` (jamais exposé au frontend)
- Tous les clients sont backend-only

#### `lib/api/move.ts`
**Rôle** : Configuration des smart contracts déployés

**Exports** :
- `TANZANITE_PACKAGE_ID` : ID du package Tanzanite déployé
- Utilise `NEXT_PUBLIC_TANZANITE_PACKAGE_ID` (variable d'environnement)

---

## 🔗 Code Partagé

### `lib/shared/` - Code utilisé par Frontend et Backend

#### `lib/shared/interfaces.ts`
**Rôle** : Interfaces TypeScript et schémas de validation

**Exports** :

##### `RegisterAoRRequest`
**Type** : Schéma Superstruct pour la requête
```typescript
{
  name: string;
}
```

##### `RegisterAoRResult`
**Type** : Schéma pour le résultat de l'événement
```typescript
{
  admin: string;
  name: string; // Converti depuis vector<u8>
}
```
**Note** : Utilise `coerce` pour convertir automatiquement le tableau de bytes en string

##### `RegisterAoRResponse`
**Type** : Réponse complète de l'API
```typescript
{
  admin: string;
  name: string;
  txDigest: string;
}
```

**Utilisation** :
- Frontend : Validation des réponses API
- Backend : Validation des requêtes et parsing des événements

#### `lib/shared/openid.ts`
**Rôle** : Configuration des providers OAuth

**Exports** :
- `GOOGLE_CLIENT_ID` : Client ID Google OAuth
- `FACEBOOK_CLIENT_ID` : Client ID Facebook OAuth
- `TWITCH_CLIENT_ID` : Client ID Twitch OAuth
- `APPLE_CLIENT_ID` : Client ID Apple OAuth

**Source** : Variables d'environnement `NEXT_PUBLIC_*_CLIENT_ID`

#### `lib/shared/utils.ts`
**Rôle** : Fonctions utilitaires partagées

**Fonctions** :
- `throwExpression(error)` : Helper pour lancer des erreurs dans les expressions
- `first(array)` : Helper pour obtenir le premier élément d'un array

---

## 📦 Smart Contracts

### Emplacement
- **Dossier** : `move/`
- **Langage** : Sui Move
- **Compilation** : `sui move build`
- **Déploiement** : `sui client publish`

### Structure

#### `move/Move.toml`
**Rôle** : Configuration du package Move

**Contenu** :
- Nom du package : `tanzanite`
- Adresses nommées : `smartcontract = "0x0"`
- Dépendances : Sui Framework (depuis GitHub)

#### `move/sources/tanzanite.move`
**Rôle** : Smart contract Tanzanite Registry

**Structs** :

##### `GlobalRegistry`
**Type** : Objet partagé (Shared Object)
```move
public struct GlobalRegistry has key, store {
    id: sui::object::UID,
    aor_admin: std::option::Option<address>,
    aor_name: std::option::Option<vector<u8>>,
}
```

**Propriétés** :
- `key` : Peut être stocké sur la blockchain
- `store` : Peut être transféré
- Objet partagé : Accessible et modifiable par tous

##### `AoRRegistered`
**Type** : Événement émis lors de l'enregistrement
```move
public struct AoRRegistered has copy, drop, store {
    admin: address,
    name: vector<u8>,
}
```

**Fonctions** :

##### `init(ctx)`
**Rôle** : Fonction d'initialisation (appelée automatiquement au déploiement)
- Crée un objet `GlobalRegistry` partagé
- Initialise les champs à `None`
- Partage l'objet avec `sui::transfer::share_object()`

##### `register_aor(reg, name, ctx)`
**Rôle** : Enregistre le premier AoR (genesis)
- Vérifie qu'aucun AoR n'est déjà enregistré (`assert`)
- Enregistre l'adresse de l'expéditeur comme admin
- Enregistre le nom fourni
- Émet l'événement `AoRRegistered`
- **Important** : Ne peut être appelé qu'une seule fois

##### `get_admin(reg)`
**Rôle** : Lit l'admin actuel (si enregistré)
- Retourne `Option<address>`

##### `get_name(reg)`
**Rôle** : Lit le nom actuel (si enregistré)
- Retourne `Option<vector<u8>>`

---

## 🔄 Flux de Données

### 1. Authentification (zkLogin)

```
┌─────────┐      ┌──────────┐      ┌─────────┐      ┌──────────┐
│ Client  │─────▶│ /api/    │─────▶│ Google │─────▶│ Callback │
│ Browser │      │ auth/    │      │ OAuth   │      │ /auth/   │
│         │      │ login    │      │         │      │ google   │
└─────────┘      └──────────┘      └─────────┘      └──────────┘
                                                           │
                                                           ▼
┌─────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ Session │◀─────│ /api/    │◀─────│ zkLogin  │◀─────│ Token    │
│ Cookie  │      │ auth/    │      │ Session  │      │ OAuth    │
│         │      │ callback │      │ Created  │      │          │
└─────────┘      └──────────┘      └──────────┘      └──────────┘
```

**Étapes** :
1. Utilisateur clique sur "Se connecter"
2. Frontend redirige vers `/api/auth/login?provider=google`
3. Backend redirige vers Google OAuth
4. Utilisateur s'authentifie sur Google
5. Google redirige vers `/auth/google` (callback)
6. Callback appelle `/api/auth/callback`
7. Backend crée la session zkLogin
8. Session stockée dans cookie HTTP-only
9. Redirection vers la page d'accueil

### 2. Enregistrement d'un AoR

```
┌─────────┐      ┌──────────────┐      ┌──────────┐
│ Client  │─────▶│ /api/        │─────▶│ Sui      │
│ (React) │      │ register-aor │      │ Blockchain│
│         │      │ /tx          │      │          │
└─────────┘      └──────────────┘      └──────────┘
      │                  │
      │                  ▼
      │         ┌─────────────────┐
      │         │ Transaction     │
      │         │ Block Built     │
      │         └─────────────────┘
      │                  │
      │                  ▼
      │         ┌─────────────────┐
      │         │ Client Signs    │
      │         │ (ephemeral key) │
      │         └─────────────────┘
      │                  │
      ▼                  ▼
┌─────────┐      ┌──────────────┐      ┌──────────┐
│ Client  │─────▶│ /api/         │─────▶│ Gas      │
│ Signs   │      │ register-aor  │      │ Station  │
│         │      │ /exec         │      │          │
└─────────┘      └──────────────┘      └──────────┘
      │                  │                    │
      │                  ▼                    ▼
      │         ┌─────────────────┐  ┌──────────────┐
      │         │ zkLogin         │  │ Transaction  │
      │         │ Signature       │  │ Executed     │
      │         │ Assembled       │  │ (Sponsored)  │
      │         └─────────────────┘  └──────────────┘
      │                  │                    │
      │                  ▼                    ▼
      │         ┌─────────────────┐  ┌──────────────┐
      │         │ Event Parsed    │  │ Response     │
      │         │ (AoRRegistered) │  │ Returned     │
      │         └─────────────────┘  └──────────────┘
      │                  │
      ▼                  ▼
┌─────────┐      ┌──────────────┐
│ UI      │◀─────│ Success      │
│ Updated │      │ Displayed    │
└─────────┘      └──────────────┘
```

**Étapes détaillées** :
1. Utilisateur remplit le formulaire et soumet
2. Frontend appelle `useRegisterAoRMutation().mutateAsync()`
3. Hook appelle `/api/register-aor/tx` avec `{ name: "..." }`
4. Backend construit la transaction Sui
5. Backend retourne le transaction block à signer
6. Frontend signe avec l'ephemeral key pair (côté client)
7. Frontend appelle `/api/register-aor/exec` avec la signature
8. Backend assemble la signature zkLogin complète
9. Backend envoie la transaction au Gas Station (sponsorisée)
10. Transaction exécutée sur la blockchain Sui
11. Événement `AoRRegistered` émis
12. Backend parse l'événement et retourne les données
13. Frontend affiche le succès

### 3. Vérification de l'état du registre

```
┌─────────┐      ┌──────────────┐      ┌──────────┐
│ Client  │─────▶│ /api/        │─────▶│ Sui      │
│ (React) │      │ registry-    │      │ Blockchain│
│         │      │ status       │      │          │
└─────────┘      └──────────────┘      └──────────┘
      │                  │                    │
      │                  ▼                    ▼
      │         ┌─────────────────┐  ┌──────────────┐
      │         │ Read            │  │ GlobalRegistry│
      │         │ GlobalRegistry  │  │ Object       │
      │         │ Object          │  │ Retrieved    │
      │         └─────────────────┘  └──────────────┘
      │                  │                    │
      │                  ▼                    ▼
      │         ┌─────────────────┐  ┌──────────────┐
      │         │ Parse Fields    │  │ Convert      │
      │         │ (aor_admin,     │  │ bytes to     │
      │         │  aor_name)      │  │ string       │
      │         └─────────────────┘  └──────────────┘
      │                  │
      ▼                  ▼
┌─────────┐      ┌──────────────┐
│ UI      │◀─────│ Status       │
│ Updated │      │ Displayed    │
└─────────┘      └──────────────┘
```

**Étapes** :
1. Page `/registry` se charge
2. Frontend appelle `useQuery()` avec `/api/registry-status`
3. Backend lit l'objet `GlobalRegistry` depuis Sui
4. Backend parse les champs (`aor_admin`, `aor_name`)
5. Backend convertit `aor_name` (bytes) en string
6. Backend retourne l'état (isRegistered, admin, name)
7. Frontend affiche les informations

---

## 🔒 Sécurité

### Frontend

**Données sensibles** :
- ❌ **Jamais stockées** : JWT, salt, randomness, clés privées
- ✅ **Stockées en mémoire** : Ephemeral key pair (perdu au refresh)
- ✅ **Accessibles** : Wallet address, provider OAuth

**Protection** :
- Les données sensibles ne sont jamais exposées au client
- L'ephemeral key pair reste en mémoire (jamais persisté)
- Validation des données avant envoi au backend

### Backend

**Données sensibles** :
- ✅ **Stockées dans cookies HTTP-only** : JWT, salt, randomness
- ✅ **Chiffrées** : Avec `IRON_SESSION_SECRET`
- ✅ **Non accessibles depuis JavaScript** : Cookies HTTP-only

**Protection** :
- Routes API protégées par `zkLoginSponsoredTxExecHandler`
- Validation stricte des données d'entrée
- Utilisation de `SHINAMI_SUPER_ACCESS_KEY` (jamais exposé)
- Vérification de l'existence des objets avant utilisation

### Smart Contracts

**Sécurité** :
- Assert pour empêcher les enregistrements multiples
- Objets partagés pour contrôle décentralisé
- Événements pour traçabilité

---

## 🔐 Variables d'Environnement

### Frontend (NEXT_PUBLIC_*)

**Accessibles depuis le navigateur** :
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` : Client ID Google OAuth
- `NEXT_PUBLIC_SHINAMI_NODE_ACCESS_KEY` : Clé pour accès Node (lecture seule)
- `NEXT_PUBLIC_TANZANITE_PACKAGE_ID` : ID du package déployé

### Backend (sans NEXT_PUBLIC_)

**Serveur uniquement** :
- `IRON_SESSION_SECRET` : Secret pour chiffrer les cookies
- `SHINAMI_SUPER_ACCESS_KEY` : Clé complète Shinami (backend uniquement)
- `GLOBAL_REGISTRY_ID` : ID de l'objet GlobalRegistry

### Configuration

**Fichier** : `.env.local` (non versionné)

**Exemple** :
```env
# OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Session
IRON_SESSION_SECRET=your_random_32_byte_hex_string

# Shinami
SHINAMI_SUPER_ACCESS_KEY=your_shinami_super_key
NEXT_PUBLIC_SHINAMI_NODE_ACCESS_KEY=your_shinami_node_key

# Smart Contracts
NEXT_PUBLIC_TANZANITE_PACKAGE_ID=0x...
GLOBAL_REGISTRY_ID=0x...
```

---

## 📊 Résumé de l'Architecture

| Composant | Emplacement | Exécution | Technologie |
|-----------|-------------|-----------|-------------|
| **Frontend** | `pages/*.tsx` | Navigateur | React + TypeScript |
| **Backend** | `pages/api/*.ts` | Serveur | Next.js API Routes |
| **Hooks** | `lib/hooks/` | Navigateur | React Query |
| **Clients API** | `lib/api/` | Serveur | Shinami SDK |
| **Types** | `lib/shared/` | Les deux | TypeScript |
| **Smart Contracts** | `move/sources/` | Blockchain | Sui Move |

---

## 🚀 Pour Ajouter une Nouvelle Fonctionnalité

### 1. Nouvelle Page Frontend
```
pages/my-feature.tsx
```
- Utilise `useZkLoginSession()` pour l'authentification
- Appelle les APIs via hooks ou fetch

### 2. Nouvelle Route API Backend
```
pages/api/my-feature.ts
```
- Utilise `withZkLoginUserRequired()` pour protéger
- Utilise `sui`, `gas` pour les interactions blockchain

### 3. Nouveau Hook Frontend
```
lib/hooks/api.ts
```
- Ajoutez `useMyFeatureMutation()` ou `useMyFeatureQuery()`

### 4. Nouvelle Interface
```
lib/shared/interfaces.ts
```
- Ajoutez vos types TypeScript et schémas Superstruct

### 5. Nouveau Smart Contract
```
move/sources/my-contract.move
```
- Écrivez votre contrat Move
- Compilez avec `sui move build`
- Déployez avec `sui client publish`

---

## 📝 Notes Importantes

1. **Séparation claire** : Frontend (navigateur) vs Backend (serveur)
2. **Sécurité** : Jamais exposer les clés sensibles au frontend
3. **zkLogin** : Authentification sans clé privée, basée sur OAuth
4. **Transactions** : Toujours sponsorisées via Gas Station
5. **Smart Contracts** : Déployés une fois, utilisés par tous

---

**Dernière mise à jour** : Décembre 2024

