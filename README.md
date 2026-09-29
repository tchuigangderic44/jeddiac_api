# Organization Website REST API (Jeddiac)

API REST complète et modulaire pour le site web d'une organisation, développée avec Express.js et Sequelize.

---

## Architecture Modulaire

Chaque fonctionnalité possède ses propres fichiers dédiés (module, routes, modèle et middlewares) pour une maintenabilité optimale :

| Module | Fichier Métier (`src/modules/`) | Fichier Routes (`src/routes/`) | Modèle (`src/models/`) |
| :--- | :--- | :--- | :--- |
| **Authentification** | [`auth.module.js`](file:///Users/APPLE/DEMO/jeddiac/src/modules/auth.module.js) | [`auth.routes.js`](file:///Users/APPLE/DEMO/jeddiac/src/routes/auth.routes.js) | [`user.js`](file:///Users/APPLE/DEMO/jeddiac/src/models/user.js) |
| **Administration** | [`admin.module.js`](file:///Users/APPLE/DEMO/jeddiac/src/modules/admin.module.js) | [`admin.routes.js`](file:///Users/APPLE/DEMO/jeddiac/src/routes/admin.routes.js) | [`user.js`](file:///Users/APPLE/DEMO/jeddiac/src/models/user.js) |
| **Profil & Annuaire** | [`user.module.js`](file:///Users/APPLE/DEMO/jeddiac/src/modules/user.module.js) | [`user.routes.js`](file:///Users/APPLE/DEMO/jeddiac/src/routes/user.routes.js) | [`user.js`](file:///Users/APPLE/DEMO/jeddiac/src/models/user.js) |
| **Actualités (News)** | [`news.module.js`](file:///Users/APPLE/DEMO/jeddiac/src/modules/news.module.js) | [`news.routes.js`](file:///Users/APPLE/DEMO/jeddiac/src/routes/news.routes.js) | [`news.js`](file:///Users/APPLE/DEMO/jeddiac/src/models/news.js) |
| **Agenda (Événements)**| [`agenda.module.js`](file:///Users/APPLE/DEMO/jeddiac/src/modules/agenda.module.js) | [`agenda.routes.js`](file:///Users/APPLE/DEMO/jeddiac/src/routes/agenda.routes.js) | [`agenda.js`](file:///Users/APPLE/DEMO/jeddiac/src/models/agenda.js) |
| **Missions** | [`mission.module.js`](file:///Users/APPLE/DEMO/jeddiac/src/modules/mission.module.js) | [`mission.routes.js`](file:///Users/APPLE/DEMO/jeddiac/src/routes/mission.routes.js) | [`mission.js`](file:///Users/APPLE/DEMO/jeddiac/src/models/mission.js) |
| **Articles (Blog)** | [`article.module.js`](file:///Users/APPLE/DEMO/jeddiac/src/modules/article.module.js) | [`article.routes.js`](file:///Users/APPLE/DEMO/jeddiac/src/routes/article.routes.js) | [`article.js`](file:///Users/APPLE/DEMO/jeddiac/src/models/article.js) |
| **Formulaire Contact** | [`contact.module.js`](file:///Users/APPLE/DEMO/jeddiac/src/modules/contact.module.js) | [`contact.routes.js`](file:///Users/APPLE/DEMO/jeddiac/src/routes/contact.routes.js) | [`contact.js`](file:///Users/APPLE/DEMO/jeddiac/src/models/contact.js) |
| **Newsletter** | [`newsletter.module.js`](file:///Users/APPLE/DEMO/jeddiac/src/modules/newsletter.module.js) | [`newsletter.routes.js`](file:///Users/APPLE/DEMO/jeddiac/src/routes/newsletter.routes.js) | [`newsletter.js`](file:///Users/APPLE/DEMO/jeddiac/src/models/newsletter.js) |

---

## Sécurité des Routes via Middlewares

Toutes les routes de l'API sont strictement sécurisées par des middlewares :
1. **Routes Administrateur** (`/admin/...`) :
   - `protectRoute` : Vérifie la validité du token JWT et s'assure qu'il n'a pas été révoqué (via la `Blacklist`).
   - `onlyAdmin` : Vérifie que le rôle de l'utilisateur authentifié est bien `admin`.
   - `parsePaginationHeaders` : Valide et encadre les paramètres de pagination (`page`, `limit`).
   - Upload sécurisé : Validation MIME type (`imageValidator`) et stockage haché avec quota de fichiers.
2. **Routes Privées Utilisateurs** (`/user/profile`, etc.) :
   - `protectRoute` : Authentification requise.
   - `user.ensureUserExists` : Vérifie que le compte existe et est actif.
3. **Routes Publiques et Formulaires** (`/contact`, `/newsletter/subscribe`, etc.) :
   - `validateRequiredFields` : Vérifie la présence des champs obligatoires non-vides.
   - `validateEmail` : Validation du format d'adresse email.
   - `parsePaginationHeaders` : Nettoyage et sécurisation des paramètres de pagination pour les listes publiques.
   - Filtrage `status: 'active'` : Empêche la consultation de contenus suspendus par les visiteurs.

---

## Rôles Utilisateurs

Le système gère les 5 rôles demandés :
1. `admin` : Administrateur de la plateforme.
2. `member` : Membre de l'organisation.
3. `honorary member` (ou `honorary_member`) : Membre d'honneur.
4. `operational` : Membre de l'équipe opérationnelle.
5. `partner` : Partenaire de l'organisation (avec champ spécifique `conseil`).

---

## Attributs de l'Utilisateur

- **Nom** (`lastName`)
- **Prénom** (`firstName`)
- **Email** (`email`)
- **Métier / Titre** (`metier`)
- **Bibliographie / Bio** (`bibliographie`)
- **Avatar** (`avatar`)
- **Lien LinkedIn** (`linkedin`)
- **Conseil / Board advisory** (`conseil`) *(spécifique aux partenaires)*
- **Téléphone** (`phone`)
- **Rôle** (`role`)
- **Statut** (`status`: `active`, `desactivated`, `pending`)

---

## Spécification OpenAPI

La spécification OpenAPI 3.0 complète est disponible dans [`openapi.yaml`](file:///Users/APPLE/DEMO/jeddiac/openapi.yaml).

## Démarrage

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run dev

# Démarrage en production
npm start
```
