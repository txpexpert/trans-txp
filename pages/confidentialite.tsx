import Head from 'next/head'
import Link from 'next/link'

export default function Confidentialite() {
  return (
    <>
      <Head>
        <title>Politique de confidentialité — Import-IA</title>
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
      ` }} />

      <header style={{ background: 'var(--ink)', borderBottom: '2px solid var(--gold)', padding: '0 2rem', height: 56, display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: 'var(--gold2)', letterSpacing: '-.02em', textDecoration: 'none' }}>
          IMPORT-EXPERT
        </Link>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
        <h1>Politique de confidentialité</h1>
        <p style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 24 }}>Dernière mise à jour : Septembre 2026</p>

        <p>La présente politique décrit la manière dont Import-IA collecte, utilise et protège les données personnelles des utilisateurs du Site, conformément à la loi n°09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel.</p>

        <h2>1. Données collectées</h2>
        <ul>
          <li>Données d'identification et de compte : nom, prénom, adresse email, société, téléphone, profil métier ;</li>
          <li>Statut de vérification de l'adresse email ;</li>
          <li>Données de connexion et d'usage : historique de connexion, requêtes adressées à l'assistant IA, circulaires consultées ;</li>
          <li>Données de facturation, le cas échéant, pour la gestion des abonnements payants.</li>
        </ul>

        <h2>2. Finalités du traitement</h2>
        <p>Les données collectées sont utilisées pour : la création et la gestion du compte utilisateur (y compris la vérification de l'adresse email par lien de confirmation), la fourniture des services du Site, l'amélioration des outils et de l'assistant IA, la communication d'informations relatives au compte, et le respect des obligations légales applicables.</p>

        <h2>3. Conservation des données</h2>
        <p>Les données sont conservées pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, conformément aux durées légales applicables.</p>

        <h2>4. Partage des données</h2>
        <p>Les données ne sont pas cédées à des tiers à des fins commerciales. Elles peuvent être partagées avec des prestataires techniques (hébergement, envoi d'emails de confirmation, traitement de paiement) strictement dans la mesure nécessaire à la fourniture du service.</p>

        <h2>5. Sécurité</h2>
        <p>Le Site met en œuvre des mesures techniques et organisationnelles raisonnables pour protéger les données personnelles, notamment le chiffrement des mots de passe et la vérification des adresses email à l'inscription.</p>

        <h2>6. Droits de l'utilisateur</h2>
        <p>Conformément à la réglementation applicable, l'utilisateur dispose d'un droit d'accès, de rectification, d'opposition et de suppression de ses données personnelles, à exercer via les coordonnées de contact du Site.</p>

        <h2>7. Cookies</h2>
        <p>Le Site utilise des cookies techniques nécessaires à son fonctionnement (maintien de la session de connexion). Aucun cookie publicitaire tiers n'est utilisé à ce jour.</p>

        <h2>8. Contact</h2>
        <p>Pour toute question relative à la présente politique, contactez Import-IA via le formulaire de contact du Site.</p>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1rem 2rem', textAlign: 'center', fontSize: 11, color: 'var(--ink3)' }}>
        © 2026 Import-IA
      </footer>
    </>
  )
}
