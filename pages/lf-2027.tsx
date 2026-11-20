// pages/lf-2027.tsx — campagne « Loi de finances 2027 : ce qui change au 1er janvier pour vos importations ».
// Squelette prêt pour décembre : contenu, dates et liens à compléter dans lib/webinaires.ts après parution du texte.
// Non référencée tant que LF2027.publie est faux.
import Head from 'next/head'
import Link from 'next/link'
import SiteShell from '../components/SiteShell'
import { LF2027 } from '../lib/webinaires'

export default function Lf2027() {
  const w = LF2027
  return (
    <SiteShell title="Loi de finances 2027 : ce qui change pour vos importations | Import-eXPert" description={w.principale.titre}>
      {!w.publie && <Head><meta name="robots" content="noindex, nofollow" /></Head>}
      <section className="x-hero">
        <div className="x-wrap">
          <div className="x-eyebrow">Loi de finances 2027</div>
          <h1 className="x-h1 x-h1-sm">Ce qui change au 1er janvier <em>pour vos importations</em></h1>
          <p className="x-lead">Droits d’importation, taxes, procédures, régimes et origine : les mesures de la loi de finances 2027 qui touchent vos opérations, chacune rattachée à son texte, et les produits concernés.</p>
          {!w.publie && <p className="x-disclaimer">Le détail des mesures est publié dès la parution du texte au Bulletin officiel.</p>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <Link href="/fiches/nouvelle" className="x-btn x-btn-dark">Vérifier mes produits</Link>
            <Link href="/diagnostic" className="x-btn x-btn-line">Mesurer mon exposition</Link>
          </div>
        </div>
      </section>
      <section className="x-sec-tight">
        <div className="x-wrap" style={{ display: 'grid', gap: 18 }}>
          <div className="x-ff">
            <div className="x-eyebrow">Session en direct · ouverte à tous, sans inscription</div>
            <h2 className="x-pr-h2" style={{ marginTop: 8 }}>{w.principale.titre}</h2>
            <p>{w.principale.duree}. Diffusée en direct sur LinkedIn et YouTube, puis disponible ici en rediffusion.</p>
            {w.principale.lien ? <a href={w.principale.lien} className="x-btn x-btn-dark" target="_blank" rel="noreferrer">Rejoindre le direct</a>
              : <p className="x-ff-note">Date et lien du direct annoncés début janvier.</p>}
          </div>
          <div className="x-ff">
            <div className="x-eyebrow">Sessions par profil · selon la demande</div>
            <ul className="x-vl-list" style={{ marginTop: 10 }}>{w.sessionsProfils.map(s => (
              <li key={s.id}><div><b>{s.titre}</b> · {s.duree}</div>
                <p>{s.active && s.lien ? <a href={s.lien} target="_blank" rel="noreferrer">Rejoindre la session</a> : 'Ouverte si la demande le justifie : signalez votre intérêt via le formulaire de contact.'}</p></li>))}</ul>
            <Link href="/contact?sujet=lf-2027" className="x-btn x-btn-line x-btn-sm">Signaler mon intérêt</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
