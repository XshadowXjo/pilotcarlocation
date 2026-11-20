# Pilot Car Élite — site de location

Site de location de véhicules : catalogue, réservation en ligne, paiement de l'acompte (Stripe),
caution en ligne (Swikly), espace client et administration.

## Stack

- **Front** : React 19 + Vite + Tailwind CSS 4 (`src/`)
- **Back** : Supabase — base Postgres, authentification, stockage des documents, fonctions Edge (`supabase/functions/`)
- **Services** : Stripe (acompte), Swikly (caution), Resend (e-mails), OpenRouteService (prix de livraison)

## Démarrer en local

```bash
npm install
npm run dev
```

Le fichier `.env.local` contient l'URL du projet Supabase et sa clé publique.

## Organisation

| Dossier | Rôle |
|---|---|
| `src/pages/` | Pages du site (accueil, véhicules, réservation, compte, admin, pages légales) |
| `src/components/` | Composants, rangés par zone (home, reservation, admin…) |
| `src/services/supabase/` | Tous les appels à Supabase |
| `src/lib/` | Utilitaires (tarifs, dates, statuts) |
| `supabase/functions/` | Fonctions serveur ; le code partagé est dans `_shared/` |
| `supabase/migrations/` | Changements de la base, à appliquer dans l'ordre |
| `supabase/schema.sql` | Instantané de référence du schéma de la base |

## Règles importantes

- **Le prix fait foi côté serveur** : une réservation est créée uniquement par la fonction
  `create-reservation`, qui recalcule le prix. Les règles de tarif sont dans
  `supabase/functions/_shared/pricing.ts`, réutilisé par le site pour l'affichage.
- **Admin** : se nomme uniquement depuis le tableau de bord Supabase (`user_profiles.is_admin`).
  La base refuse ce changement depuis le site.
- Depuis le site, un admin ne peut changer que le **statut** d'une réservation ; paiement et
  caution sont mis à jour par les fonctions serveur.

## Déployer les fonctions

```bash
supabase functions deploy <nom-de-la-fonction>
```
