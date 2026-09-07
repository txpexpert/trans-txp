// pages/politique-confidentialite.tsx
// Politique de confidentialité — requise pour la publication sur le Google Play Store.

export default function PolitiqueConfidentialite() {
  return (
    <div style={{
      maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px',
      fontFamily: 'sans-serif', color: '#1C1C1C', lineHeight: 1.7,
    }}>
      <h1 style={{ color: '#153E82', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
        Politique de confidentialité — Import-eXPert
      </h1>
      <p style={{ color: '#666', fontSize: 13, marginBottom: 40 }}>
        Dernière mise à jour : 7 septembre 2026
      </p>

      <Section title="1. Introduction">
        Import-eXPert (« l'application », « nous ») respecte votre vie privée. Cette politique
        explique quelles informations nous collectons, comment nous les utilisons, et quels sont
        vos droits.
      </Section>

      <Section title="2. Données que nous collectons">
        <p style={{ marginBottom: 12 }}>Selon les fonctionnalités que vous utilisez, nous pouvons collecter :</p>
        <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
          <li><strong>Informations de compte</strong> : adresse e-mail, lors de la création d'un compte ou d'un essai gratuit.</li>
          <li><strong>Données d'utilisation</strong> : pages consultées, modules utilisés, à des fins d'amélioration du service.</li>
          <li><strong>Contenu des requêtes</strong> : les questions posées au Copilote IA sont transmises à notre service d'intelligence artificielle pour générer une réponse.</li>
          <li><strong>Données techniques</strong> : type d'appareil, système d'exploitation, à des fins de compatibilité et de sécurité.</li>
        </ul>
        <p>Nous ne collectons pas de données de localisation précise, de contacts, ni de données biométriques.</p>
      </Section>

      <Section title="3. Utilisation des données">
        <p style={{ marginBottom: 12 }}>Vos données sont utilisées pour :</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Fournir et améliorer les fonctionnalités de l'application (classement tarifaire, copilote IA, calculateurs, veille réglementaire)</li>
          <li>Gérer votre compte et votre abonnement</li>
          <li>Vous contacter en cas de support technique</li>
          <li>Assurer la sécurité et prévenir les fraudes</li>
        </ul>
      </Section>

      <Section title="4. Partage des données">
        <p style={{ marginBottom: 12 }}>Nous ne vendons pas vos données personnelles. Nous pouvons partager certaines données avec :</p>
        <ul style={{ paddingLeft: 20 }}>
          <li>Des prestataires techniques (hébergement, base de données, service d'intelligence artificielle) nécessaires au fonctionnement de l'application, liés par des obligations de confidentialité</li>
          <li>Les autorités compétentes, si la loi l'exige</li>
        </ul>
      </Section>

      <Section title="5. Conservation des données">
        Vos données sont conservées le temps nécessaire à la fourniture du service, ou jusqu'à la
        suppression de votre compte à votre demande.
      </Section>

      <Section title="6. Vos droits">
        <p style={{ marginBottom: 12 }}>Vous pouvez à tout moment demander :</p>
        <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
          <li>L'accès à vos données personnelles</li>
          <li>La rectification ou la suppression de vos données</li>
          <li>La suppression de votre compte</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à :{' '}
          <a href="mailto:contact@import-ia.com" style={{ color: '#153E82', fontWeight: 600 }}>
            contact@import-ia.com
          </a>
        </p>
      </Section>

      <Section title="7. Sécurité">
        Nous mettons en œuvre des mesures techniques raisonnables pour protéger vos données contre
        l'accès non autorisé, la perte ou l'altération.
      </Section>

      <Section title="8. Modifications de cette politique">
        Cette politique peut être mise à jour périodiquement. La date de dernière mise à jour est
        indiquée en haut de ce document.
      </Section>

      <Section title="9. Contact">
        Pour toute question concernant cette politique de confidentialité, contactez-nous à :{' '}
        <a href="mailto:contact@import-ia.com" style={{ color: '#153E82', fontWeight: 600 }}>
          contact@import-ia.com
        </a>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ color: '#153E82', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
        {title}
      </h2>
      <div style={{ fontSize: 14.5, color: '#333' }}>
        {children}
      </div>
    </div>
  )
}