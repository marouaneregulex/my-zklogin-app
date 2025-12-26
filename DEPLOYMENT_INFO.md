# Informations de Déploiement - Tanzanite Registry

## ✅ Déploiement Réussi (Nouveau)

Le smart contract a été déployé avec succès sur Sui Testnet.

## 📋 Informations Importantes

### Package ID
```
0x4f88ec7979e7509dc86688b395312a96ee69555388cb594ebd53d9e5142b163d
```

### GlobalRegistry Object ID
```
0x768813ef53f0b143089f5906a7513f38d63596ce0d0c6ee9ce2a619fc12b97f3
```

### Transaction Digest
```
3tH1gGtnLLWxkM6AvAgCQDYWk7u4iuwbhPKM2JnCR63Q
```

## 🔧 Configuration Requise

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Smart Contract Configuration - Tanzanite Registry
NEXT_PUBLIC_TANZANITE_PACKAGE_ID=0x4f88ec7979e7509dc86688b395312a96ee69555388cb594ebd53d9e5142b163d
GLOBAL_REGISTRY_ID=0x768813ef53f0b143089f5906a7513f38d63596ce0d0c6ee9ce2a619fc12b97f3
```

## 🔗 Liens Utiles

- **Transaction sur SuiVision**: https://testnet.suivision.xyz/txblock/3tH1gGtnLLWxkM6AvAgCQDYWk7u4iuwbhPKM2JnCR63Q
- **Package sur SuiVision**: https://testnet.suivision.xyz/object/0x4f88ec7979e7509dc86688b395312a96ee69555388cb594ebd53d9e5142b163d
- **GlobalRegistry sur SuiVision**: https://testnet.suivision.xyz/object/0x768813ef53f0b143089f5906a7513f38d63596ce0d0c6ee9ce2a619fc12b97f3

## 📝 Notes

- Le `GlobalRegistry` est un objet **partagé** (Shared), ce qui signifie qu'il peut être modifié par n'importe qui
- La fonction `register_aor` ne peut être appelée **qu'une seule fois** (genesis)
- Après l'enregistrement, l'adresse qui a appelé `register_aor` devient l'admin
- Le smart contract a été compilé sans warnings (alias dupliqués corrigés)

## 🚀 Prochaines Étapes

1. ✅ Ajoutez les variables d'environnement dans `.env.local`
2. ✅ Redémarrez votre serveur Next.js (`npm run dev`)
3. ✅ Allez sur `/registry` pour tester l'enregistrement d'un AoR

## ⚠️ Important

Si vous avez déjà enregistré un AoR avec un déploiement précédent, vous devrez utiliser ce nouveau déploiement pour enregistrer un nouveau AoR (car chaque déploiement crée un nouveau `GlobalRegistry`).

