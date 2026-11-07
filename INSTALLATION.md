# Installation d'Import-eXPert sur une nouvelle infrastructure

Ce guide met le site en ligne de zéro : **nouvelle base Supabase**, **nouveau dépôt GitHub**, **projet Vercel**. Il inclut le système de facturation des abonnements (pro-formas, factures, avoirs, paiements par virement).

Durée : environ 30 minutes, sans compter la copie des données de référence.

---

## 1. Base de données Supabase

1. Créer le projet sur [supabase.com](https://supabase.com). Région conseillée : **eu-west**. Noter le mot de passe de la base.
2. Ouvrir **SQL Editor → New query**.
3. Coller **tout** le contenu de `supabase/setup/installation_complete.sql`, puis cliquer sur **Run**.
   - Ce fichier crée les 32 tables, les fonctions, la sécurité (RLS), le bucket privé `justificatifs` et le compte super-administrateur.
   - Il s'exécute **une seule fois**, sur une base vide.
   - Pour le régénérer après une modification des migrations : `./scripts/setup/build-install-sql.sh`.
4. Contrôle rapide, dans une nouvelle requête :
   ```sql
   select code, price_per_year from subscription_plans order by sort_order;
   -- pro 5000 · premium 9000 · enterprise (vide)
   ```
5. Récupérer, dans **Project Settings → API** : l'URL du projet, la clé `anon` et la clé `service_role`.

### Données de référence (facultatif, mais nécessaire aux modules métier)

Le tarif SH (≈ 18 000 lignes), les décisions de classement et la base documentaire ne sont pas dans le zip. Pour les recopier depuis l'ancienne base, lancer ce script depuis votre ordinateur :

```bash
SOURCE_DB_URL='postgresql://…ancienne base…' \
TARGET_DB_URL='postgresql://…nouvelle base…' \
./scripts/setup/copier-donnees-reference.sh
```

Les chaînes de connexion se trouvent dans **Project Settings → Database → Connection string → URI** (port 5432). Le détail est en tête du script.

**Le système de facturation n'a pas besoin de ces données** : vous pouvez faire vos essais d'abonnement sans elles.

---

## 2. Dépôt GitHub

```bash
unzip import-expert-facturation.zip -d import-expert && cd import-expert
git init && git add -A && git commit -m "Import-eXPert — version avec facturation"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/VOTRE-DEPOT.git
git push -u origin main
```

Le fichier `.env.example` liste les variables. Ne jamais mettre les vraies valeurs dans le dépôt : `.env.local` est ignoré par git.

---

## 3. Essai sur votre ordinateur (facultatif)

Prérequis : Node.js 20 ou plus.

```bash
cp .env.example .env.local     # puis compléter : URL et clés Supabase, USER_SECRET, ADMIN_SECRET
npm install
npm run dev                    # http://localhost:3000
```

Sans `RESEND_API_KEY`, aucun email ne part. Les pro-formas et factures restent toutefois consultables dans « Mon abonnement » et dans le backoffice.

---

## 4. Mise en ligne sur Vercel

1. **Add New → Project →** importer le dépôt GitHub. Le framework Next.js est détecté automatiquement.
2. **Environment Variables :** saisir les variables de `.env.example`. Au minimum :
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (l'URL Vercel, ou votre domaine)
   - `USER_SECRET`, `ADMIN_SECRET`, `CRON_SECRET` : de longues chaînes aléatoires
   - `RESEND_API_KEY`, `RESEND_FROM`, et si possible `RESEND_FROM_BILLING`
   - `ANTHROPIC_API_KEY` et `OPENAI_API_KEY` pour les modules d'IA
3. **Deploy.** La tâche quotidienne (`vercel.json`, 5h15 UTC) est créée automatiquement. Elle gère les expirations, les pro-formas de fin d'essai et de renouvellement, et les rappels.

### Emails depuis rigorislex.ma

Dans Resend → **Domains → Add domain** `rigorislex.ma`, puis ajouter chez votre registraire les enregistrements DNS indiqués (SPF, DKIM). Une fois le domaine vérifié, définir :
`RESEND_FROM_BILLING=RIGORIS LEX — Abonnements <abonnement@rigorislex.ma>`

---

## 5. Premiers réglages dans le site

1. **Super-administrateur :** ouvrir `/backoffice` et se connecter avec `txp.expert@gmail.com`. À la première connexion, l'étape « Créer mon mot de passe » s'affiche. Pour changer cet email, modifier la ligne de la table `admin_accounts` avant de vous connecter.
2. **Backoffice → Abonnements → Paramètres de facturation :**
   - raison sociale (RIGORIS LEX), forme juridique, capital, adresse ;
   - ICE, IF, RC, TP, CNSS : à saisir dès l'immatriculation, en blanc sur les documents en attendant ;
   - banque, titulaire du compte, **RIB** ;
   - code site **IXP** (SIV, LRF ou IML pour les autres sites).
3. **Compte generaladmin**, avec tous les accès et sans paiement :
   - créer un compte client normal via `/auth/register` ;
   - dans Backoffice → Abonnements, cliquer sur **Generaladmin** sur sa ligne ;
   - ou dans Supabase : `update users set role = 'generaladmin' where email = '…';`

---

## 6. Scénario d'essai de la facturation

| Étape | Où | Résultat attendu |
|---|---|---|
| Inscription depuis `/tarifs` → « Essai 14 jours » (plan Pro) | site | Compte `ABIXP26.01AA`, essai de 14 jours, plan souhaité Pro |
| Mon abonnement → profil (entreprise + ICE, ou particulier) | `/mon-abonnement` | Profil enregistré |
| « Recevoir ma pro-forma » | `/mon-abonnement` | Pro-forma `PF-IXP26AA01`, 5 000 HT + 1 000 TVA = **6 000 TTC**, email envoyé |
| Déposer un justificatif (PDF) | `/mon-abonnement` | Statut « en cours de vérification » ; alerte à l'administrateur |
| Backoffice → Abonnements → coller `PFIXP26AA01` | backoffice | La pro-forma apparaît avec le 📎 du justificatif |
| Valider avec 5 999 DH | backoffice | **Refusé** (montant différent) |
| Valider avec 6 000 DH | backoffice | Facture **`IXP26AA01`**, abonnement Pro actif 12 mois, email envoyé |
| Ouvrir la facture → « Imprimer / PDF » | document | Mentions légales, HT / TVA / TTC, montant en lettres, « ACQUITTÉE » |
| Tenter de modifier la facture dans Supabase | SQL | **Refusé** : une facture émise est figée, il faut un avoir |
| Facture → « Avoir » (super-administrateur) | backoffice | Avoir `AV-IXP26AA01` |
| Export « Journal des ventes 2026 (CSV) » | backoffice | Fichier ouvrable dans Excel |
| « Lancer maintenant » | backoffice | Expirations, pro-formas de fin d'essai, rappels J-30, J-7 et J-0 |

Les numéros portent l'année d'**émission** : les essais de 2026 donnent `…26…`, et la série repart à `AA01` en 2027.

**Pour repartir d'une base propre avant le lancement**, supprimer les documents d'essai dans le SQL Editor (les factures émises sont protégées, il faut donc lever la protection le temps de la purge) :

```sql
alter table invoices disable trigger trg_invoices_no_delete;
alter table avoirs   disable trigger trg_avoirs_immutable;
delete from avoirs; delete from paiements; delete from billing_notifications; delete from subscription_events;
delete from invoices; delete from billing_counters where kind <> 'abonne';
alter table invoices enable trigger trg_invoices_no_delete;
alter table avoirs   enable trigger trg_avoirs_immutable;
```

---

## Formats de numérotation

| Document | Stocké | Affiché |
|---|---|---|
| Abonné | `ABIXP2701AA` | ABIXP27.01AA |
| Pro-forma (= référence de virement) | `PFIXP27AA01` | PF-IXP27AA01 |
| Facture (série continue, sans trou) | `IXP27AA01` | IXP27AA01 |
| Avoir | `AVIXP27AA01` | AV-IXP27AA01 |

Ordre : AA01 → AA99, puis AB01… (66 924 numéros par an).
