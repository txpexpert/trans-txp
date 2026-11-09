// pages/risques/index.tsx — Risques et litiges : page d'aiguillage.
// Une carte par fiche (lib/risques.ts) qui ouvre la page détaillée
// /risques/{slug}. Même architecture que /accords.
import Link from 'next/link'
import SiteShell from '../../components/SiteShell'
import { RISQUES, MAJ_RISQUES, type FicheRisque } from '../../lib/risques'

function Carte({ r }: { r: FicheRisque }) {
  return (
    <Link href={`/risques/${r.slug}`} className="x-acc-card">
      <div className="x-acc-top">
        <span className="x-acc-code">{r.code}</span>
        <div>
          <b className="x-acc-name">{r.titre}</b>
          <span className="x-acc-nature">{r.nature}{r.langue ? ` · ${r.langue}` : ''}</span>
        </div>
      </div>
      <dl className="x-acc-dl">
        <dt>Textes</dt><dd>{r.textes}</dd>
        <dt>Autorités</dt><dd>{r.autorites}</dd>
        <dt>Délais critiques</dt><dd>{r.delais}</dd>
        <dt>Sanctions</dt><dd>{r.sanctions}</dd>
      </dl>
      <p className="x-acc-actu"><b>À retenir</b>{r.actu}</p>
      <span className="x-acc-go">Ouvrir la fiche complète →</span>
    </Link>
  )
}

export default function RisquesPage() {
  return (
    <SiteShell
      title="Comment éviter les risques et litiges à l’importation au Maroc | IXP-Import-eXPert"
      description="Commerce extérieur, contrôle des changes, contentieux douanier, licences et autorisations préalables : ce qui déclenche un litige, ce qu’il faut éviter et ce que coûte une erreur."
    >
      <section className="x-esp-hd x-c-securiser">
        <div className="x-wrap">
          <div className="x-crumb"><Link href="/espaces/securiser">Sécuriser</Link> / Risques et litiges</div>
          <div className="x-eyebrow">Prévention des litiges</div>
          <h1 className="x-h1" style={{ fontSize: 'clamp(34px,4.4vw,54px)' }}>Comment éviter les risques et litiges&nbsp;?</h1>
          <p className="x-lead">
            Un litige à l’importation naît rarement en douane seulement : une licence manquante, un paiement mal domicilié
            ou un produit non conforme suffisent. Chaque fiche liste ce qui déclenche le contentieux, les actions à éviter,
            les signaux d’alerte et les sanctions encourues.
          </p>
        </div>
      </section>

      <section className="x-sec-tight">
        <div className="x-wrap">
          <div className="x-eyebrow">Quatre fronts de risque</div>
          <div className="x-acc-grid">{RISQUES.map(r => <Carte key={r.slug} r={r} />)}</div>
          <p className="x-note">
            Fiches mises à jour le {MAJ_RISQUES}. Pour un dossier en cours, demandez une{' '}
            <Link href="/modules/conseil">consultation personnalisée</Link>.
          </p>
        </div>
      </section>
    </SiteShell>
  )
}
