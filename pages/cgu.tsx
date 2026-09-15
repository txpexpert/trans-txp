import Head from 'next/head'
import Link from 'next/link'

export default function CGU() {
  return (
    <>
      <Head>
        <title>Conditions Générales d'Utilisation — Import-IA</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <style dangerouslySetInnerHTML={{ __html: `
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--gold:#C9A84C;--gold2:#E8C97A;--gold3:#F5E4B0;--gold4:#FBF5E6;
          --ink:#0A0A0A;--ink2:#3A3530;--ink3:#8A8078;--white:#FDFCF8;--border:#E8DFC8}
        body{font-family:'DM Sans',sans-serif;background:var(--white);color:var(--ink);line-height:1.7}
        a{color:var(--gold)}
        h1{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:400;margin-bottom:8px}
        h2{font-size:16px;font-weight:600;margin-top:32px;border-bottom:2px solid var(--gold4);padding-bottom:8px}
        p,li{font-size:14px;color:var(--ink2)}
        .warning{background:var(--gold4);border-left:4px solid var(--gold);border-radius:4px;padding:16px 20px;margin:16px 0}
        .warning p{color:var(--ink2);margin-bottom:8px}
        .warning p:last-child{margin-bottom:0}
        .warning strong{color:var(--ink)}
      ` }} />

      <header style={{ background: 'var(--ink)', borderBottom: '2px solid var(--gold)', padding: '0 2rem', height: 56, display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: 'var(--gold2)', letterSpacing: '-.02em', textDecoration: 'none' }}>
          IMPORT-EXPERT
        </Link>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <h1>Conditions Générales d'Utilisation</h1>
        <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 24 }}>Dernière mise à jour : Septembre 2026</p>

        <p>Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et l'utilisation de la plateforme Import-IA (le « Site »), plateforme d'intelligence douanière destinée aux transitaires, importateurs, exportateurs et professionnels du commerce international opérant au Maroc.</p>

        <h2>1. Objet et acceptation</h2>
        <p>En créant un compte ou en utilisant le Site, l'utilisateur reconnaît avoir pris connaissance des présentes CGU et les accepter sans réserve.</p>

        <h2>2. Description des services</h2>
        <p>Le Site propose des outils d'aide à la décision en matière douanière et fiscale : simulateurs de droits et taxes, comparateur de régimes douaniers, assistant conversationnel basé sur l'intelligence artificielle et alimenté par les circulaires de l'Administration des Douanes et Impôts Indirects (ADII), outils de screening sanctions et d'accompagnement au statut d'Opérateur Économique Agréé (OEA), ainsi que des modules d'intelligence à l'export, selon le plan d'abonnement souscrit.</p>

        <h2>3. Avertissement relatif aux simulateurs et à l'assistant IA</h2>
        <div className="warning">
          <p><strong>Les résultats fournis par les simulateurs, comparateurs et par l'assistant IA du Site sont donnés à titre indicatif et d'aide à la décision.</strong> Ils constituent des éléments d'approche et d'orientation, et ne se substituent en aucun cas aux données, calculs ou décisions officielles émanant de l'Administration des Douanes et Impôts Indirects (ADII), de la Direction Générale des Impôts, ou de toute autre autorité douanière, fiscale ou administrative compétente. Seules les données communiquées par ces autorités, notamment lors du dédouanement effectif, font foi.</p>
          <p>Le Site s'efforce d'assurer l'exactitude et la mise à jour régulière des informations, circulaires et calculs proposés. Cette information peut néanmoins comporter une marge résiduelle d'imprécision, résultant notamment de l'évolution de la réglementation douanière, de cas particuliers non couverts par les simulateurs, ou de délais de mise à jour des bases documentaires. Il appartient donc à l'utilisateur de <strong>procéder aux vérifications nécessaires auprès des professionnels qualifiés (transitaires agréés, conseillers douaniers) et des autorités compétentes</strong> avant toute déclaration en douane, tout engagement commercial ou toute décision d'investissement.</p>
          <p>En conséquence, <strong>le Site dégage toute responsabilité quant à l'usage fait par l'utilisateur des résultats, analyses ou réponses fournis par ses outils</strong>. Ces derniers constituent des paramètres d'orientation destinés à faciliter la préparation des opérations douanières et commerciales, et non des instruments de décision engageant le Site ou ses éditeurs.</p>
        </div>

        <h2>4. Compte utilisateur et vérification d'email</h2>
        <p>L'accès aux fonctionnalités du Site nécessite la création d'un compte et la confirmation de l'adresse email fournie, via le lien envoyé automatiquement à l'inscription. L'utilisateur s'engage à fournir des informations exactes et à préserver la confidentialité de ses identifiants.</p>

        <h2>5. Essai gratuit et abonnements</h2>
        <p>Le Site propose un essai gratuit de 14 jours, sans carte bancaire requise, débutant à la date de création du compte. Les modalités des abonnements payants (tarifs, périodicité, limites d'usage) sont précisées sur la page dédiée du Site.</p>

        <h2>6. Propriété intellectuelle</h2>
        <p>L'ensemble des éléments du Site (textes, structure, bases de données, outils, code source, identité visuelle) demeure la propriété exclusive d'Import-IA ou de ses partenaires, sauf mention contraire.</p>

        <h2>7. Limitation de responsabilité</h2>
        <p>Le Site met tout en œuvre pour assurer la disponibilité et la fiabilité de ses services, sans garantie de résultat. Le Site ne saurait être tenu responsable des interruptions de service, des erreurs ou omissions dans les contenus, ni des conséquences directes ou indirectes de l'utilisation ou de l'impossibilité d'utiliser le Site, dans les limites permises par la loi applicable.</p>

        <h2>8. Résiliation</h2>
        <p>L'utilisateur peut résilier son compte à tout moment. Le Site se réserve le droit de suspendre ou résilier l'accès d'un utilisateur en cas de manquement aux présentes CGU.</p>

        <h2>9. Droit applicable</h2>
        <p>Les présentes CGU sont soumises au droit marocain. Tout litige relève de la compétence exclusive des juridictions marocaines.</p>

        <h2>10. Modification des CGU</h2>
        <p>Le Site se réserve le droit de modifier les présentes CGU à tout moment. La poursuite de l'utilisation du Site après modification vaut acceptation des nouvelles conditions.</p>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1rem 2rem', textAlign: 'center', fontSize: 11, color: 'var(--ink3)' }}>
        © 2026 Import-IA
      </footer>
    </>
  )
}
