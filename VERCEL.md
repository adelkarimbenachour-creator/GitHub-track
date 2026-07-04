# 🚀 Déploiement sur Vercel - Guide de Configuration

Ce projet est entièrement configuré pour être hébergé sur **Vercel** avec un backend serverless Express et un frontend React (Vite).

## 📋 Prérequis

1. Un compte [Vercel](https://vercel.com/) (gratuit).
2. Le [Vercel CLI](https://vercel.com/cli) installé localement, ou liez simplement votre dépôt GitHub à Vercel.

---

## ⚡ Méthode 1 : Déploiement en 1 clic (Recommandé)

Le moyen le plus simple de déployer est de lier votre dépôt GitHub à Vercel :

1. Poussez (Push) ce projet sur un dépôt **GitHub** (public ou privé).
2. Allez sur le tableau de bord de **Vercel** et cliquez sur **Add New > Project**.
3. Importez votre dépôt GitHub.
4. **Très Important :** Configurez les variables d'environnement (voir la section ci-dessous).
5. Cliquez sur **Deploy**. Vercel se chargera de tout automatiquement !

---

## 💻 Méthode 2 : Déploiement via Vercel CLI

Si vous préférez utiliser le terminal :

1. Connectez-vous à votre compte Vercel :
   ```bash
   vercel login
   ```
2. Lancez le déploiement à la racine du projet :
   ```bash
   vercel
   ```
3. Suivez les étapes à l'écran (gardez les options par défaut).
4. Pour déployer en production :
   ```bash
   vercel --prod
   ```

---

## 🔑 Variables d'environnement requises

Pour que l'analyse IA fonctionne, vous devez ajouter vos clés d'API dans les paramètres de votre projet Vercel (**Project Settings > Environment Variables**) :

| Nom de la variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Votre clé d'API Google Gemini (indispensable pour les analyses d'intelligence). |
| `GITHUB_CLIENT_ID` | (Optionnel) ID client OAuth GitHub si vous configurez l'authentification. |
| `GITHUB_CLIENT_SECRET` | (Optionnel) Secret client OAuth GitHub correspondant. |

---

## ⚙️ Comment ça marche ?

Le fichier `vercel.json` à la racine orchestre le déploiement :
- Le frontend React (Vite) est construit de manière statique et hébergé directement sur le CDN ultra-rapide de Vercel.
- Toutes les requêtes `/api/*` et `/oauth/*` sont automatiquement redirigées vers la fonction Serverless Express située dans `api/index.ts`.
