// components/FicheView.tsx — rendu d'une fiche produit douane (même mise en page que le modèle).
import { Fragment } from 'react'
const dh = (n: number) => Math.round(n).toLocaleString('fr-FR') + ' DH'
const fmtSh = (c?: string | null) => (c && c.length === 10 ? `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6, 8)}.${c.slice(8)}` : c || '—')
const dt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
const LIB: Record<string, string> = { oui: 'Oui', non: 'Non', a_verifier: 'À vérifier', conforme: 'Conforme', a_faire: 'À faire' }
const ST: Record<string, [string, string]> = { obligatoire: ['ob', 'Obligatoire'], a_verifier: ['co', 'À vérifier'], recommande: ['re', 'Recommandé'] }

export default function FicheView({ f }: { f: Record<string, any> }) {
  const q = Number(f.quantite_type) || 0
  const vu = Number(f.valeur_unitaire) || 0
  const taux = Number(f.taux_droit) || 0
  const base = q * vu
  const vd = base + (Number(f.fret) || 0) + (Number(f.assurance) || 0)
  const di = vd * taux / 100
  const taxes: { nom: string; taux: number }[] = (f.autres_taxes || []).filter((t: any) => t && t.nom)
  const autres = taxes.map(t => ({ nom: t.nom, taux: Number(t.taux) || 0, montant: vd * (Number(t.taux) || 0) / 100 }))
  const tva = (vd + di + autres.reduce((s, t) => s + t.montant, 0)) * 0.20
  const calc = q > 0 && vu > 0 && f.devise === 'MAD'
  const refs: string[] = []
  if (f.decision_ref && f.decision_ref !== 'aucune') refs.push(`Décision de classement : circulaire n° ${f.decision_ref}`)
  if (f.justification) refs.push(f.justification)
  refs.push('Code des douanes, art. 20 ter (valeur en douane)')
  if (taxes.some(t => /TPI/i.test(t.nom))) refs.push('TPI 0,25 % : note n° D7106/16/ADII/100')
  refs.push('Tarif des droits d’importation 2026')

  return (
    <article className="x-fp">
      <header className="x-fp-hd">
        <div>
          <span className="x-mono">FICHE PRODUIT DOUANE{f.ref_interne ? ` · ${f.ref_interne}` : ''}</span>
          <h2>{f.designation}</h2>
          {f.description && <p>{f.description}</p>}
          {f.photo_url && <img src={f.photo_url} alt={f.designation} style={{ marginTop: 12, maxHeight: 140, borderRadius: 10, border: '1px solid var(--x-line)' }} />}
        </div>
        <div className="x-fp-stamp">
          <span>Vérifiée le</span><b>{dt(f.verifie_le)}</b>
          <span>Prochaine revue</span><b>{f.prochaine_revue || '—'}</b>
          <span>Statut</span><b>{f.statut === 'complete' ? 'Complète' : 'Brouillon'}</b>
        </div>
      </header>
      <div className="x-fp-grid">
        <section>
          <h3>1. Classement tarifaire</h3>
          <div className="x-fp-code">{fmtSh(f.code_sh)}</div>
          {f.libelle_tarif && <p>{f.libelle_tarif}</p>}
          <dl>
            <dt>Droit d’importation</dt><dd>{f.taux_droit != null ? <b>{String(f.taux_droit).replace('.', ',')} %</b> : '—'}</dd>
            <dt>Unité du tarif</dt><dd>{f.unite_tarif || '—'}</dd>
            <dt>Décision</dt><dd>{f.decision_ref === 'aucune' ? 'Aucune décision applicable' : f.decision_ref ? `Circulaire n° ${f.decision_ref}` : '—'}</dd>
            <dt>Justification</dt><dd>{f.justification || '—'}</dd>
          </dl>
        </section>
        <section>
          <h3>2. Origine et accord</h3>
          <dl>
            <dt>Fournisseur</dt><dd>{f.fournisseur || '—'}</dd>
            <dt>Pays d’origine</dt><dd>{f.pays_origine || '—'}</dd>
            <dt>Accord préférentiel</dt><dd>{f.accord === 'aucun' ? 'Aucun applicable : droit commun' : f.accord || '—'}</dd>
            <dt>Preuve d’origine</dt><dd>{f.preuve_origine || '—'}</dd>
          </dl>
          <h3 style={{ marginTop: 24 }}>3. Valeur et quantités</h3>
          <dl>
            <dt>Valeur unitaire</dt><dd>{vu ? `${vu.toLocaleString('fr-FR')} ${f.devise || ''} ${f.incoterm || ''}` : '—'}</dd>
            <dt>Fret, assurance</dt><dd>{f.fret || f.assurance ? `${Number(f.fret || 0).toLocaleString('fr-FR')} + ${Number(f.assurance || 0).toLocaleString('fr-FR')} ${f.devise || ''}` : '—'}</dd>
            <dt>Redevances, commissions</dt><dd>{f.redevances || 'Aucune déclarée'}</dd>
            <dt>Poids net / brut</dt><dd>{f.poids_net_kg || f.poids_brut_kg ? `${f.poids_net_kg ?? '—'} kg / ${f.poids_brut_kg ?? '—'} kg` : '—'}</dd>
          </dl>
        </section>
        <section>
          <h3>4. Documents et conformité</h3>
          <ul className="x-fp-docs">
            {(f.documents || []).map((d: any) => { const s = ST[d.statut] || ST.obligatoire; return <li key={d.nom}><span className={s[0]}>{s[1]}</span>{d.nom}</li> })}
          </ul>
          <dl>
            <dt>Contrôle MIC</dt><dd>{LIB[f.controle_mic] || '—'}</dd>
            <dt>Marchandise dangereuse</dt><dd>{LIB[f.dangereuse] || '—'}</dd>
            <dt>Marquage, étiquetage</dt><dd>{LIB[f.marquage] || '—'}</dd>
          </dl>
        </section>
        <section>
          <h3>5. Droits et taxes {calc ? `(exemple : ${q} ${f.unite_tarif || 'unités'})` : ''}</h3>
          {calc ? (
            <table className="x-fp-calc"><tbody>
              <tr><td>Valeur des marchandises</td><td>{dh(base)}</td></tr>
              <tr className="sub"><td>Valeur en douane</td><td>{dh(vd)}</td></tr>
              <tr><td>Droit d’importation {String(taux).replace('.', ',')} %</td><td>{dh(di)}</td></tr>
              {autres.map(t => <tr key={t.nom}><td>{t.nom} {String(t.taux).replace('.', ',')} %</td><td>{dh(t.montant)}</td></tr>)}
              <tr><td>TVA à l’importation 20 %</td><td>{dh(tva)}</td></tr>
              <tr className="tot"><td>Droits et taxes</td><td>{dh(di + tva + autres.reduce((s, t) => s + t.montant, 0))}</td></tr>
            </tbody></table>
          ) : (
            <>
              <dl>
                <dt>Droit d’importation</dt><dd>{f.taux_droit != null ? `${String(f.taux_droit).replace('.', ',')} %` : '—'}</dd>
                {taxes.map(t => <Fragment key={t.nom}><dt>{t.nom}</dt><dd>{String(t.taux).replace('.', ',')} %</dd></Fragment>)}
                <dt>TVA à l’importation</dt><dd>20 % (taux normal)</dd>
              </dl>
              <p className="x-fp-note">Renseignez la quantité type et une valeur unitaire en dirhams pour obtenir le calcul.</p>
            </>
          )}
          {f.notes && <p className="x-fp-note"><b>Notes :</b> {f.notes}</p>}
        </section>
      </div>
      <footer className="x-fp-ft">
        <div><span className="x-mono">TEXTES DE RÉFÉRENCE</span><p>{refs.join(' · ')}</p></div>
        <div><span className="x-mono">TRANSMIS À L’ÉTAPE SUIVANTE</span><p>Code SH {fmtSh(f.code_sh)}, droit de {f.taux_droit ?? '—'} %, origine {f.pays_origine || '—'} → <b>Optimiser</b></p></div>
      </footer>
      <p className="x-fp-disc">Document d’aide à la décision, établi à partir des informations saisies et des textes disponibles à la date de vérification. Il ne constitue ni une décision ni un avis opposable : les données finales sont celles édictées par les autorités compétentes.</p>
    </article>
  )
}
