// pages/dossiers/[id].tsx — dossier défendable : page imprimable (PDF), horodatée,
// avec numéro, empreinte et adresse de vérification en ligne.
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import SiteShell from '../../components/SiteShell'
import FicheView from '../../components/FicheView'
import { pointsOuverts } from '../../lib/dossiersClient'

const fmtSh = (c?: string | null) => (c && c.length === 10 ? `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}.${c.slice(8)}` : c || '—')
const horodatage = (d: string) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'medium', timeZone: 'Africa/Casablanca' }) + ' (heure de Casablanca)'

export default function DossierPage() {
  const { query } = useRouter()
  const [d, setD] = useState<any>(null)
  const [err, setErr] = useState('')
  const [origine, setOrigine] = useState('')
  useEffect(() => { setOrigine(window.location.origin) }, [])
  useEffect(() => {
    if (!query.id) return
    fetch(`/api/dossiers/${query.id}`, { credentials: 'same-origin' })
      .then(async r => { const j = await r.json(); if (!r.ok) setErr(j.error || 'Dossier introuvable'); else setD(j.dossier) })
      .catch(() => setErr('Erreur réseau'))
  }, [query.id])
  async function annuler() {
    const r = await fetch(`/api/dossiers/${d.id}`, { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut: 'annule' }) })
    if (r.ok) setD({ ...d, statut: 'annule' })
  }
  const lien = d ? `${origine}/verifier/${d.numero}` : ''
  const textes: string[] = d ? Array.from(new Set((d.fiches || []).flatMap((f: any) => [
    f.decision_ref && f.decision_ref !== 'aucune' ? `Circulaire n° ${f.decision_ref} (décision de classement)` : null,
    (f.autres_taxes || []).some((t: any) => /TPI/i.test(t.nom)) ? 'Note n° D7106/16/ADII/100 (taxe parafiscale à l’importation)' : null,
  ].filter(Boolean) as string[]).concat(['Code des douanes, art. 20 ter (valeur en douane)', 'Tarif des droits d’importation 2026']))) : []

  return (
    <SiteShell title={`${d?.numero || 'Dossier'} | IXP-Import-eXPert`}>
      <section className="x-sec-tight">
        <div className="x-wrap">
          <div className="x-crumb noprint"><Link href="/dossiers">Dossiers défendables</Link> / {d?.numero || '…'}</div>
          {err && <div className="x-pc-cta"><p>{err}</p><Link href="/dossiers" className="x-btn x-btn-gold">Retour aux dossiers</Link></div>}
          {d && (
            <>
              <div className="noprint" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '10px 0 18px' }}>
                <button type="button" className="x-btn x-btn-dark" onClick={() => window.print()}>Imprimer ou enregistrer en PDF</button>
                <Link href={`/verifier/${d.numero}`} className="x-btn x-btn-line" target="_blank">Page de vérification ↗</Link>
                {d.statut === 'emis' && <details className="x-fl-del"><summary className="x-btn x-btn-line">Annuler ce dossier</summary>
                  <p>Le dossier restera consultable, mais la vérification en ligne indiquera qu’il est annulé. <button type="button" className="x-btn x-btn-dark x-btn-sm" onClick={annuler}>Confirmer l’annulation</button></p></details>}
              </div>

              <article className="x-dos">
                <header className="x-dos-cover">
                  <span className="x-mono">DOSSIER DÉFENDABLE · {d.type === 'operation' ? 'PAR OPÉRATION' : 'PAR PRODUIT'}</span>
                  <h1>{d.titre}</h1>
                  {d.statut === 'annule' && <p className="x-fp-alert"><b>Dossier annulé.</b> Il a été remplacé ou retiré par son titulaire.</p>}
                  <dl>
                    <dt>Numéro</dt><dd className="mono"><b>{d.numero}</b></dd>
                    <dt>Émis le</dt><dd>{horodatage(d.created_at)}</dd>
                    <dt>Titulaire</dt><dd>{d.titulaire?.raison_sociale || '—'}{d.titulaire?.ice ? ` · ICE ${d.titulaire.ice}` : ''}</dd>
                    {d.operation && <>
                      {d.operation.reference_dum && <><dt>DUM</dt><dd>{d.operation.reference_dum}</dd></>}
                      {d.operation.date && <><dt>Date de l’opération</dt><dd>{d.operation.date}</dd></>}
                      {d.operation.facture && <><dt>Facture</dt><dd>{d.operation.facture}</dd></>}
                      {d.operation.bureau && <><dt>Bureau</dt><dd>{d.operation.bureau}</dd></>}
                      {d.operation.regime && <><dt>Régime</dt><dd>{d.operation.regime}</dd></>}
                      {d.operation.transitaire && <><dt>Transitaire</dt><dd>{d.operation.transitaire}</dd></>}
                    </>}
                  </dl>
                  <div className="x-dos-verif">
                    <span className="x-mono">VÉRIFICATION</span>
                    <p>Ce dossier est enregistré. Son authenticité et son intégrité se vérifient à l’adresse :<br /><b className="mono">{lien}</b></p>
                    <p>Empreinte SHA-256 du contenu :<br /><span className="mono x-dos-hash">{d.empreinte}</span></p>
                  </div>
                  <h2>Contenu</h2>
                  <table className="x-fl"><thead><tr><th>#</th><th>Produit</th><th>Code SH</th><th>Origine</th><th>Points à trancher</th></tr></thead><tbody>
                    {(d.fiches || []).map((f: any, i: number) => {
                      const p = pointsOuverts(f)
                      return <tr key={i}><td>{i + 1}</td><td><b>{f.designation}</b>{f.ref_interne ? ` · ${f.ref_interne}` : ''}</td><td className="mono">{fmtSh(f.code_sh)}</td><td>{f.pays_origine || '—'}</td>
                        <td>{p.length ? p.join(' ; ') : 'Aucun'}</td></tr>
                    })}
                  </tbody></table>
                </header>

                {(d.fiches || []).map((f: any, i: number) => (
                  <section key={i} className="x-dos-fiche"><span className="x-mono x-dos-num">{d.numero} · Pièce {i + 1}/{d.fiches.length}</span><FicheView f={f} /></section>
                ))}

                <footer className="x-dos-fin">
                  <h2>Textes de référence du dossier</h2>
                  <ul>{textes.map(t => <li key={t}>{t}</li>)}</ul>
                  <h2>Portée du dossier</h2>
                  <p>Ce dossier reproduit à l’identique les fiches produits telles qu’elles existaient au moment de son émission. Une fiche modifiée ensuite donne lieu à un nouveau dossier, avec un nouveau numéro : le présent dossier n’est jamais modifié. Il atteste de l’analyse menée par le titulaire et des textes sur lesquels elle s’appuie, à la date indiquée.</p>
                  <p className="x-dos-disc">Document d’aide à la décision, établi à partir des informations saisies et des textes disponibles à la date de vérification. Il ne constitue ni une décision ni un avis opposable : les données finales sont celles édictées par les autorités compétentes.</p>
                  <p className="mono x-dos-num">{d.numero} · {d.empreinte.slice(0, 16)}…</p>
                </footer>
              </article>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  )
}
