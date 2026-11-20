import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

// Brouillons des pages légales, rédigés à partir de ce que fait réellement le site.
// Tout ce qui est marqué <Todo> doit être complété par le loueur, et l'ensemble relu
// par un professionnel (avocat, expert-comptable) avant la mise en ligne.

const LAST_UPDATE = '20 novembre 2026'

function Todo({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded bg-yellow-300/70 px-1 font-semibold text-black">À COMPLÉTER : {children}</mark>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold uppercase tracking-wide text-black">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#2E3034]">{children}</div>
    </section>
  )
}

function LegalLayout({ title, highlight, children }: { title: string; highlight: string; children: ReactNode }) {
  return (
    <div className="bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-6 py-14 md:px-12">
        <h1 className="text-3xl font-bold uppercase tracking-wide text-black sm:text-4xl">
          {title} <span className="text-[#5E7A00]">{highlight}</span>
        </h1>
        <p className="mt-3 text-xs text-[#4A4C50]">Dernière mise à jour : {LAST_UPDATE}</p>
        {children}
        <nav className="mt-14 flex flex-wrap gap-4 border-t border-border pt-6 text-xs font-bold uppercase tracking-wider">
          <Link to="/mentions-legales" className="text-[#5E7A00]">Mentions légales</Link>
          <Link to="/conditions-generales" className="text-[#5E7A00]">Conditions générales de location</Link>
          <Link to="/confidentialite" className="text-[#5E7A00]">Confidentialité</Link>
        </nav>
      </article>
    </div>
  )
}

export function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions" highlight="légales">
      <Section title="Éditeur du site">
        <p>
          Le site est édité par <strong>Pilot Car Élite (PCE)</strong>, <Todo>forme juridique (EI, SASU, SARL…)</Todo>{' '}
          au capital de <Todo>montant</Todo> €, immatriculée sous le numéro SIRET <Todo>numéro</Todo>{' '}
          (RCS <Todo>ville</Todo>), dont le siège est situé <Todo>adresse complète</Todo>, Yvelines (78).
        </p>
        <p>
          Numéro de TVA intracommunautaire : <Todo>numéro, ou « TVA non applicable, art. 293 B du CGI »</Todo>.
        </p>
        <p>
          Directeur de la publication : <Todo>nom du dirigeant</Todo>.
        </p>
        <p>
          Contact : <Todo>téléphone réel (le site affiche encore 06 00 00 00 00)</Todo> —{' '}
          <Todo>adresse e-mail réelle</Todo>.
        </p>
      </Section>

      <Section title="Hébergement">
        <p>
          Site web : <Todo>hébergeur choisi (nom, adresse, téléphone), par exemple Netlify, Vercel ou Cloudflare</Todo>.
        </p>
        <p>
          Données (base de données, comptes clients, documents) : Supabase (supabase.com),{' '}
          <Todo>adresse postale à reprendre des conditions de Supabase</Todo>. Les données du site sont
          stockées dans l'Union européenne (Irlande).
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          Les textes, logos, photographies et éléments graphiques du site sont la propriété de Pilot Car Élite
          ou utilisés avec autorisation. Toute reproduction sans accord écrit préalable est interdite.
        </p>
      </Section>

      <Section title="Responsabilité">
        <p>
          Les tarifs et disponibilités affichés sont donnés à titre indicatif jusqu'à la validation de la
          réservation par l'agence. Pilot Car Élite ne saurait être tenue responsable d'une indisponibilité
          temporaire du site.
        </p>
      </Section>
    </LegalLayout>
  )
}

export function ConditionsGeneralesPage() {
  return (
    <LegalLayout title="Conditions générales" highlight="de location">
      <Section title="1. Objet">
        <p>
          Les présentes conditions encadrent la location de véhicules proposée par Pilot Car Élite (« le
          loueur ») via le site et en agence. Toute réservation implique leur acceptation, matérialisée par la
          case à cocher du formulaire de réservation.
        </p>
      </Section>

      <Section title="2. Conditions pour louer">
        <p>
          Le conducteur doit être âgé d'au moins <Todo>âge minimum</Todo> ans et titulaire d'un permis B valide
          depuis au moins <Todo>nombre</Todo> ans. Lors de la réservation, il fournit une copie de son permis
          (recto et verso), de sa pièce d'identité (recto et verso) et un justificatif de domicile. Les
          originaux sont présentés lors de la remise du véhicule.
        </p>
        <p>
          Conducteur additionnel : <Todo>autorisé ou non, conditions et tarif</Todo>.
        </p>
      </Section>

      <Section title="3. Réservation">
        <p>
          La réservation en ligne est possible pour une durée de 1 à 6 jours. Au-delà, la location se fait sur
          devis, à demander depuis la page Contact.
        </p>
        <p>
          Une demande de réservation n'engage le loueur qu'après validation : l'agence vérifie le dossier et
          la disponibilité, puis confirme ou refuse la demande par e-mail. Le client peut suivre l'état de ses
          réservations depuis son espace client.
        </p>
      </Section>

      <Section title="4. Prix et paiement">
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises, selon la durée (tarif 24 h, forfait 3 jours,
          forfait semaine). Le prix retenu est celui calculé au moment de la demande, promotions éventuelles
          incluses.
        </p>
        <p>
          Après confirmation, un <strong>acompte de 50 %</strong> du montant total est demandé par lien de
          paiement sécurisé (Stripe). Le solde est réglé <Todo>moment et moyens de paiement du solde</Todo>.
        </p>
        <p>
          Kilométrage inclus : 250 km pour 24 h, 750 km pour 3 jours, <Todo>kilométrage inclus à la semaine</Todo>.
          Chaque kilomètre supplémentaire est facturé 0,50 €.
        </p>
      </Section>

      <Section title="5. Caution">
        <p>
          Une caution dont le montant dépend du véhicule (indiqué sur sa fiche et dans le récapitulatif) est
          exigée. Elle est soit bloquée en ligne via notre partenaire Swikly, soit réglée sur place lors de la
          remise du véhicule, au choix du client lors de la réservation.
        </p>
        <p>
          La caution n'est pas débitée si le véhicule est restitué dans l'état où il a été remis. Elle est
          libérée après la restitution et le contrôle du véhicule, dans un délai de <Todo>délai</Todo>. En cas
          de dommage, de carburant manquant, de kilomètres supplémentaires ou de frais impayés, le loueur peut
          la débiter à hauteur des sommes dues, sur justificatifs.
        </p>
      </Section>

      <Section title="6. Remise et restitution du véhicule">
        <p>
          Le véhicule est remis à la gare de Mantes-Station (78) ou livré à l'adresse indiquée par le client.
          La livraison est facturée 1 € par kilomètre de trajet depuis l'agence, montant calculé et affiché
          avant la réservation.
        </p>
        <p>
          Un état des lieux contradictoire est réalisé au départ et au retour. Le véhicule est restitué avec{' '}
          <Todo>le même niveau de carburant / plein fait</Todo>. Retard de restitution :{' '}
          <Todo>tolérance et pénalités</Todo>.
        </p>
      </Section>

      <Section title="7. Prolongation">
        <p>
          Le client peut demander une prolongation depuis son espace client. Elle est soumise à la disponibilité
          du véhicule et à la validation de l'agence, puis facturée au tarif en vigueur selon les mêmes
          modalités (acompte de 50 %).
        </p>
      </Section>

      <Section title="8. Annulation">
        <p>
          Conformément à l'article L221-28, 12° du Code de la consommation, le droit de rétractation ne
          s'applique pas aux locations de véhicules fournies à une date déterminée.
        </p>
        <p>
          Conditions d'annulation par le client : <Todo>délais, et part de l'acompte remboursée ou conservée</Todo>.
          En cas de refus de la demande par le loueur, aucun montant n'est dû.
        </p>
      </Section>

      <Section title="9. Assurance et responsabilité">
        <p>
          Le véhicule est assuré tous risques. Une franchise de <Todo>montant</Todo> € reste à la charge du
          client en cas de sinistre responsable. <Todo>Exclusions (conduite sous l'emprise d'alcool, conducteur
          non déclaré, usage sur circuit, etc.)</Todo>
        </p>
        <p>
          Le client est responsable des infractions commises pendant la location (amendes, péages,
          stationnement). Les avis de contravention lui sont réattribués. Frais de gestion :{' '}
          <Todo>montant éventuel</Todo>.
        </p>
      </Section>

      <Section title="10. Réclamations et médiation">
        <p>
          Toute réclamation peut être adressée à <Todo>adresse e-mail ou postale</Todo>. À défaut de solution
          amiable, le client consommateur peut saisir gratuitement le médiateur de la consommation :{' '}
          <Todo>nom et site du médiateur auquel le loueur adhère (adhésion obligatoire)</Todo>.
        </p>
        <p>Les présentes conditions sont soumises au droit français.</p>
      </Section>
    </LegalLayout>
  )
}

export function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de" highlight="confidentialité">
      <Section title="Responsable du traitement">
        <p>
          Pilot Car Élite, <Todo>adresse du siège</Todo>. Contact pour toute question sur vos données :{' '}
          <Todo>adresse e-mail dédiée</Todo>.
        </p>
      </Section>

      <Section title="Données collectées">
        <ul className="list-disc space-y-1 pl-5">
          <li>Identité et coordonnées : nom, prénom, date de naissance, téléphone, e-mail, adresse postale.</li>
          <li>Permis de conduire : numéro et copies recto et verso.</li>
          <li>Copies de la pièce d'identité (recto et verso) et justificatif de domicile.</li>
          <li>Réservations : véhicule, dates, lieu de retrait ou adresse de livraison, montants.</li>
          <li>Compte client (facultatif) : e-mail et mot de passe, conservés de façon chiffrée.</li>
          <li>Messages envoyés via le formulaire de contact.</li>
        </ul>
        <p>
          Les données de carte bancaire sont saisies directement chez Stripe (acompte) et Swikly (caution) :
          elles ne transitent pas par nos serveurs et nous ne les conservons pas.
        </p>
      </Section>

      <Section title="Pourquoi nous les utilisons">
        <ul className="list-disc space-y-1 pl-5">
          <li>Traiter et suivre votre réservation, la remise et la restitution du véhicule (exécution du contrat).</li>
          <li>Vérifier votre identité et votre droit à conduire avant la location (exécution du contrat, intérêt légitime).</li>
          <li>Encaisser l'acompte et gérer la caution (exécution du contrat).</li>
          <li>Vous envoyer les e-mails liés à votre réservation (exécution du contrat).</li>
          <li>Répondre à vos demandes de contact ou de devis (intérêt légitime).</li>
          <li>Respecter nos obligations comptables et fiscales (obligation légale).</li>
        </ul>
        <p>Vos données ne sont ni vendues ni utilisées à des fins publicitaires.</p>
      </Section>

      <Section title="Qui y a accès">
        <p>Uniquement l'équipe Pilot Car Élite et les prestataires techniques nécessaires au service :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase : base de données, comptes et stockage des documents, hébergés dans l'Union européenne (Irlande).</li>
          <li>Stripe : paiement de l'acompte.</li>
          <li>Swikly : caution en ligne.</li>
          <li>Resend : envoi des e-mails de réservation.</li>
          <li>OpenRouteService (HeiGIT, Allemagne) : calcul de la distance de livraison à partir de l'adresse saisie.</li>
          <li><Todo>hébergeur du site une fois choisi</Todo>.</li>
        </ul>
        <p>
          Certains de ces prestataires sont établis hors de l'Union européenne (notamment aux États-Unis). Les
          transferts sont alors encadrés par les clauses contractuelles types de la Commission européenne ou
          par le Data Privacy Framework.
        </p>
      </Section>

      <Section title="Durée de conservation">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Copies du permis, de la pièce d'identité et du justificatif : <Todo>durée, par exemple 3 mois après
            la fin de la location sauf litige en cours</Todo>.
          </li>
          <li>Données de réservation et de facturation : 10 ans (obligation comptable).</li>
          <li>Compte client : jusqu'à sa suppression, ou 3 ans après la dernière activité.</li>
          <li>Messages de contact : 3 ans après le dernier échange.</li>
        </ul>
      </Section>

      <Section title="Vos droits">
        <p>
          Vous pouvez demander l'accès à vos données, leur rectification, leur suppression, leur portabilité,
          ou vous opposer à un traitement, en écrivant à <Todo>adresse e-mail dédiée</Todo>. Si vous estimez
          que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (cnil.fr).
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Le site n'utilise aucun cookie publicitaire ni outil de mesure d'audience. Il conserve uniquement dans
          votre navigateur les informations nécessaires pour vous garder connecté à votre espace client. Elles
          sont indispensables au service et ne nécessitent pas de consentement.
        </p>
      </Section>
    </LegalLayout>
  )
}
