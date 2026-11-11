// pages/barometre.tsx — Baromètre 2026 : résultats publics de l'enquête, contexte officiel et espace presse.
import type { GetServerSideProps } from 'next'
import Link from 'next/link'
import SiteShell from '../components/SiteShell'
import { QUESTIONS, SEUIL_AGREGATS, SEUIL_PUBLICATION } from '../lib/barometre'
import { agregatsBarometre, type Agregats } from '../lib/barometreAgregats'

const pc = (x: number, n: number) => (n ? Math.round((x / n) * 100) : 0)

export const getServerSideProps: GetServerSideProps<{ a: Agregats }> = async ({ res }) => {
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200')
  return { props: { a: await agregatsBarometre() } }
}

function chiffresCles(a: Agregats) {
  const r = a.resultats!
  const q = (id: string) => QUESTIONS.find(x => x.id === id)!
  const top = (id: string) => { const x = r[id]; const i = x.cnt.indexOf(Math.max(...x.cnt)); return { lib: q(id).o[i], p: pc(x.cnt[i], x.n) } }
  const ctrl = r.controle, ale = r.ale, frein = top('freins'), retard = top('retards'), prio = top('priorites')
  return [
    `${pc(ctrl.cnt[1] + ctrl.cnt[2], ctrl.n)} % des répondants ont fait l’objet d’un contrôle a posteriori ou d’un redressement au cours des trois dernières années.`,
    `${pc(ale.cnt[ale.cnt.length - 1], ale.n)} % n’utilisent aucun accord de libre-échange ; premier frein cité : « ${frein.lib} » (${frein.p} %).`,
    `Première cause de retard au dédouanement : « ${retard.lib} », citée par ${retard.p} % des répondants.`,
    `Première priorité pour les douze prochains mois : « ${prio.lib} » (${prio.p} %).`,
  ]
}

export default function Barometre({ a }: { a: Agregats }) {
  const diffuse = !!a.resultats
  const reste = Math.max(0, SEUIL_PUBLICATION - a.n)
  return (
    <SiteShell title="Baromètre 2026 de la friction douanière au Maroc | IXP-Import-eXPert"
      description="Délais de dédouanement, erreurs de conformité, accords de libre-échange sous-exploités : les résultats du Baromètre 2026 auprès des importateurs, transitaires et directions financières.">
      <section className="x-hero" style={{ paddingBottom: 18 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">Baromètre 2026 · {a.publie ? 'Résultats' : 'Enquête en cours'}</div>
          <h1 className="x-h1 x-h1-sm">La friction douanière au Maroc, <em>mesurée par ceux qui la vivent</em></h1>
          <p className="x-lead">Délais, erreurs de conformité, accords sous-exploités, priorités : douze questions posées aux importateurs, transitaires et directions financières. Les réponses sont anonymes ; seuls des agrégats sont publiés.</p>
          <div className="x-bm-etat">
            <b>{a.n}</b><span>répondant{a.n > 1 ? 's' : ''} à ce jour</span>
            {!a.publie && <div className="x-bm-jauge"><i style={{ width: `${Math.min(100, (a.n / SEUIL_PUBLICATION) * 100)}%` }} /></div>}
            <small>{a.publie ? 'Échantillon suffisant : résultats publiés, mis à jour en continu.' : `Publication des résultats à ${SEUIL_PUBLICATION} répondants : encore ${reste} réponse${reste > 1 ? 's' : ''}.`}</small>
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/enquete" className="x-btn x-btn-dark">Répondre à l’enquête (4 minutes)</Link>
            <Link href="/diagnostic" className="x-btn x-btn-line">Mesurer l’exposition de mon entreprise</Link>
          </div>
        </div>
      </section>

      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap" style={{ display: 'grid', gap: 22 }}>
          <div className="x-ff">
            <div className="x-eyebrow">Le contexte officiel</div>
            <div className="x-bm-ctx">
              <div><b>23,5 MMDH</b><span>de redressements pour sous-facturation en 2025, en hausse de 33 % sur un an</span></div>
              <div><b>8,09 MMDH</b><span>de recettes issues des contrôles en 2025, sur 161 MMDH de recettes douanières</span></div>
              <div><b>Contrôle a posteriori</b><span>analyse de risque et centre national de supervision : les écarts se détectent après le dédouanement</span></div>
            </div>
            <p className="x-ff-note">Sources : Administration des douanes et impôts indirects, rapport d’activité 2025, repris par la presse économique (EcoActu, TelQuel, mai 2026).</p>
          </div>

          {diffuse ? (
            <>
              {!a.publie && <p className="x-ff-note" style={{ margin: 0 }}>Résultats provisoires ({a.n} répondants) : à interpréter avec prudence jusqu’à {SEUIL_PUBLICATION} répondants.</p>}
              {a.publie && (
                <div className="x-ff">
                  <div className="x-eyebrow">Chiffres clés</div>
                  <ul className="x-bm-cles">{chiffresCles(a).map(t => <li key={t}>{t}</li>)}</ul>
                </div>)}
              <div className="x-bm-grid">
                {QUESTIONS.map((q, i) => {
                  const r = a.resultats![q.id]
                  const ordre = q.o.map((_, j) => j).sort((x, y) => (q.type === 'many' ? r.cnt[y] - r.cnt[x] : 0))
                  return (
                    <div key={q.id} className="x-bm-q">
                      <h3>{i + 1}. {q.t}</h3>
                      <small>{r.n} réponse{r.n > 1 ? 's' : ''}{q.type === 'many' ? ' · plusieurs choix possibles' : ''}</small>
                      {ordre.map(j => (
                        <div key={j} className="x-bm-row"><span>{q.o[j]}</span><div><i style={{ width: `${pc(r.cnt[j], r.n)}%` }} /></div><b>{pc(r.cnt[j], r.n)} %</b></div>))}
                    </div>)
                })}
              </div>
            </>
          ) : (
            <div className="x-fl-empty"><b>Les premiers résultats s’afficheront à partir de {SEUIL_AGREGATS} répondants</b>, pour qu’aucune réponse individuelle ne soit identifiable. Votre réponse compte : <Link href="/enquete">répondre à l’enquête</Link>.</div>
          )}

          <div className="x-bm-2col">
            <div className="x-ff">
              <div className="x-eyebrow">Méthodologie</div>
              <ul className="x-bm-list">
                <li>Questionnaire en ligne de douze questions fermées, ouvert aux importateurs, transitaires, exportateurs sous régimes économiques et directions financières.</li>
                <li>Réponses strictement anonymes : aucun nom, aucune adresse email ni aucun identifiant n’est demandé ou enregistré.</li>
                <li>Seuls des pourcentages agrégés sont diffusés, à partir de {SEUIL_AGREGATS} répondants ; les résultats sont considérés comme exploitables à partir de {SEUIL_PUBLICATION}.</li>
                <li>Pour les questions à choix multiples, les pourcentages ne s’additionnent pas.</li>
              </ul>
            </div>
            <div className="x-ff">
              <div className="x-eyebrow">Espace presse</div>
              <p style={{ marginTop: 0 }}>Les chiffres du Baromètre peuvent être repris avec la mention « Baromètre 2026 Import-eXPert », le nombre de répondants et la date de consultation.</p>
              <div className="x-ff-row">
                {a.publie ? <a href="/api/barometre-csv" className="x-btn x-btn-dark x-btn-sm">Télécharger les chiffres (CSV)</a>
                  : <span className="x-ff-note">Fichier de chiffres disponible à la publication.</span>}
                <Link href="/contact?sujet=presse" className="x-btn x-btn-line x-btn-sm">Contact presse</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
