// pages/echange-expert.tsx — l'échange de 20 minutes avec un expert, proposé à la fin du diagnostic.
import Link from 'next/link'
import { useEffect } from 'react'
import SiteShell from '../components/SiteShell'

export default function EchangeExpert() {
  useEffect(() => {
    fetch('/api/evenement', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ e: 'echange_vue' }) }).catch(() => {})
  }, [])
  return (
    <SiteShell title="Échange de 20 minutes avec un expert | IXP-Import-eXPert" description="Après votre diagnostic, un expert douanier relit votre résultat avec vous et vous indique les actions prioritaires.">
      <section className="x-hero">
        <div className="x-wrap" style={{ maxWidth: 820 }}>
          <div className="x-eyebrow">Après votre diagnostic · offert</div>
          <h1 className="x-h1 x-h1-sm">20 minutes avec un expert, <em>pour savoir par où commencer</em>.</h1>
          <p className="x-lead">Le diagnostic chiffre votre exposition. L’échange la transforme en décisions : un expert douanier relit votre résultat avec vous et vous indique les deux ou trois actions qui la réduisent le plus.</p>
          <ul className="x-list" style={{ marginTop: 18 }}>
            <li>Par téléphone ou en visio, sous trois jours ouvrés</li>
            <li>Les écarts critiques de votre diagnostic, et le texte qui les fonde</li>
            <li>Ce que vous pouvez corriger seul, et ce qui mérite un avis d’expert</li>
            <li>Sans engagement</li>
          </ul>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
            <Link href="/contact?sujet=echange-expert" className="x-btn x-btn-dark">Demander mon échange</Link>
            <Link href="/diagnostic" className="x-btn x-btn-line">Faire d’abord le diagnostic</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
