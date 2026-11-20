# Pilot Car Élite

Voir README.md pour la stack et l'organisation.

- `npm run dev` lance le site sur http://localhost:5173.
- Vérifier avant de livrer : `npx tsc --noEmit -p .` puis `npm run build`.
- Ne jamais insérer dans `reservations` depuis le site : passer par la fonction `create-reservation`.
- Les règles de tarif vivent dans `supabase/functions/_shared/pricing.ts` (partagé site / serveur).
- Styles : Tailwind CSS 4, classes utilitaires directement dans le JSX.
