// pages/facturation/document/[id].tsx
// ─────────────────────────────────────────────────────────────────────────────
// Document imprimable : facture pro-forma, facture ou avoir (?type=avoir).
// Rendu à partir des INSTANTANÉS figés en base (émetteur et client au moment
// de l'émission) : la facture affichée reste identique dans le temps.
// « Imprimer / PDF » utilise l'impression du navigateur.
//
// Accès : le client propriétaire (session dia_session) ou un administrateur
// (backoffice ou « Gestion des abonnements »). Exclu du middleware : un client
// dont l'abonnement est expiré doit pouvoir consulter ses documents.
//
// Mentions (CGI art. 145) : identité complète de l'émetteur (identifiants
// fiscaux laissés en blanc tant qu'ils ne sont pas saisis dans les paramètres),
// identité et ICE du client B2B, numéro en série continue, date, désignation,
// HT / TVA / TTC, mode de paiement.
// ─────────────────────────────────────────────────────────────────────────────
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { getAdminSession, parseCookie } from '../../../lib/adminAuth'
import { getBillingUser } from '../../../lib/billingServer'
import { PLAN_LABEL } from '../../../lib/subscriptions'
import {
  fmtAbonne, fmtDocNumber, fmtMAD, fmtDateLong, amountInWords, docTTC,
  type BillingDoc, type Avoir, type BillingSettings, type ClientSnapshot,
} from '../../../lib/billing'

interface Props {
  kind:  'proforma' | 'facture' | 'annulee' | 'avoir'
  doc:   BillingDoc | null
  avoir: Avoir | null
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = String(ctx.params?.id || '')
  const isAvoir = ctx.query.type === 'avoir'
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { notFound: true }

  const admin = await getAdminSession(parseCookie(ctx.req.headers.cookie), 'gestion')
  const user = admin ? null : await getBillingUser(ctx.req)
  if (!admin && !user) {
    return { redirect: { destination: `/auth/login?redirect=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } }
  }

  const sb = supabaseAdmin()
  if (isAvoir) {
    const { data } = await sb.from('avoirs').select('*').eq('id', id).maybeSingle()
    if (!data || (!admin && data.user_id !== user!.id)) return { notFound: true }
    return { props: { kind: 'avoir', doc: null, avoir: data as Avoir } }
  }
  const { data } = await sb.from('invoices').select('*').eq('id', id).maybeSingle()
  if (!data || (!admin && data.user_id !== user!.id)) return { notFound: true }
  const doc = data as BillingDoc
  const kind = doc.status === 'payee' ? 'facture' : doc.status === 'annulee' ? 'annulee' : 'proforma'
  return { props: { kind, doc, avoir: null } }
}

const v = (x: unknown) => (x === null || x === undefined || x === '' ? '—' : String(x))

export default function DocumentPage({ kind, doc, avoir }: Props) {
  const issuer: Partial<BillingSettings> = (doc?.issuer_snapshot || avoir?.issuer_snapshot || {}) as Partial<BillingSettings>
  const client: ClientSnapshot = (doc?.client_snapshot || avoir?.client_snapshot || {}) as ClientSnapshot

  const title =
    kind === 'facture' ? 'FACTURE' :
    kind === 'avoir'   ? 'FACTURE D’AVOIR' : 'FACTURE PRO-FORMA'
  const number =
    kind === 'facture' ? doc!.invoice_number :
    kind === 'avoir'   ? fmtDocNumber(avoir!.avoir_number) : fmtDocNumber(doc!.proforma_number)
  const date =
    kind === 'facture' ? doc!.issued_at || doc!.paid_at :
    kind === 'avoir'   ? avoir!.issued_at : doc!.sent_at || doc!.created_at

  const ht  = kind === 'avoir' ? avoir!.amount_ht  : Number(doc!.amount_ht ?? Number(doc!.amount) / 1.2)
  const vat = kind === 'avoir' ? avoir!.vat_amount : Number(doc!.vat_amount ?? Number(doc!.amount) - ht)
  const ttc = kind === 'avoir' ? avoir!.amount_ttc : docTTC(doc!)
  const rate = kind === 'avoir' ? avoir!.vat_rate : (doc!.vat_rate ?? 20)
  const lines = kind === 'avoir'
    ? [{ designation: `Avoir sur facture ${avoir!.invoice_number} du ${fmtDateLong(avoir!.invoice_date)} — ${avoir!.motif}`, quantite: 1, unite: 'forfait', prix_unitaire_ht: avoir!.amount_ht, total_ht: avoir!.amount_ht }]
    : (doc!.lines && doc!.lines.length ? doc!.lines : [{
        designation: `Abonnement annuel — plan ${PLAN_LABEL[doc!.plan_code] || doc!.plan_code}`, quantite: doc!.years, unite: 'an',
        prix_unitaire_ht: ht / doc!.years, total_ht: ht }])

  const issuerId: [string, unknown][] = [
    ['ICE', issuer.ice], ['IF', issuer.if_fiscal],
    ['RC', issuer.rc ? `${issuer.rc}${issuer.rc_ville ? ' — ' + issuer.rc_ville : ''}` : null],
    ['TP', issuer.taxe_professionnelle], ['CNSS', issuer.cnss],
  ]

  return (
    <>
      <Head><title>{`${title} ${number}`}</title><meta name="robots" content="noindex" /></Head>
      <style>{`
        body { margin: 0; background: #ECEAE4; font-family: 'DM Sans', Arial, sans-serif; color: #111; }
        .page { width: 210mm; min-height: 297mm; margin: 16px auto; background: #fff; padding: 16mm 15mm; box-sizing: border-box; position: relative; }
        .bar { max-width: 210mm; margin: 12px auto 0; display: flex; gap: 8px; justify-content: flex-end; }
        .bar button { padding: 8px 16px; border: 1px solid #0C2D5C; background: #0C2D5C; color: #fff; cursor: pointer; font-size: 12px; }
        table.l { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 18px; }
        table.l th { background: #0C2D5C; color: #fff; text-align: left; padding: 7px 8px; font-weight: 600; font-size: 11px; }
        table.l td { border-bottom: 1px solid #DDD; padding: 8px; vertical-align: top; }
        .r { text-align: right; }
        .muted { color: #666; }
        .stamp { position: absolute; top: 60mm; right: 18mm; transform: rotate(-12deg); border: 3px solid; padding: 6px 14px; font-weight: 700; letter-spacing: .1em; font-size: 18px; opacity: .8; }
        @media print { body { background: #fff; } .bar { display: none; } .page { margin: 0; width: auto; min-height: auto; } @page { size: A4; margin: 0; } }
      `}</style>

      <div className="bar"><button onClick={() => window.print()}>Imprimer / Enregistrer en PDF</button></div>

      <div className="page">
        {kind === 'facture'  && <div className="stamp" style={{ color: '#1A7A40', borderColor: '#1A7A40' }}>ACQUITTÉE</div>}
        {kind === 'annulee'  && <div className="stamp" style={{ color: '#C0392B', borderColor: '#C0392B' }}>ANNULÉE</div>}

        {/* En-tête : émetteur + titre */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ fontSize: 12, lineHeight: 1.55 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0C2D5C' }}>{v(issuer.raison_sociale)}</div>
            <div>{[issuer.forme_juridique, issuer.capital_social ? `au capital de ${issuer.capital_social}` : null].filter(Boolean).join(' ') || <span className="muted">Forme juridique — capital : —</span>}</div>
            <div>{v(issuer.adresse)}{issuer.ville ? `, ${issuer.ville}` : ''}{issuer.pays ? ` — ${issuer.pays}` : ''}</div>
            <div>{[issuer.telephone, issuer.email_facturation].filter(Boolean).join(' · ')}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{issuerId.map(([k, x]) => `${k} : ${v(x)}`).join(' · ')}</div>
            <div className="muted" style={{ fontSize: 11 }}>Service : {v(issuer.site_nom)}{issuer.site_url ? ` — ${issuer.site_url}` : ''}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#0C2D5C', letterSpacing: '.04em' }}>{title}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, marginTop: 4 }}>N° {number}</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Date : {fmtDateLong(date)}</div>
            {kind === 'proforma' && doc!.due_date && <div style={{ fontSize: 12 }}>Valable jusqu’au : {fmtDateLong(doc!.due_date)}</div>}
            {kind === 'facture' && doc!.proforma_number && <div style={{ fontSize: 11 }} className="muted">Solde la pro-forma {fmtDocNumber(doc!.proforma_number)}</div>}
          </div>
        </div>

        {/* Client */}
        <div style={{ marginTop: 22, marginLeft: 'auto', width: '55%', border: '1px solid #CCC', padding: '10px 12px', fontSize: 12, lineHeight: 1.55 }}>
          <div className="muted" style={{ fontSize: 10, letterSpacing: '.08em' }}>CLIENT {client.type_client === 'particulier' ? '— PARTICULIER' : ''}</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{client.raison_sociale || client.nom || client.email}</div>
          {client.raison_sociale && client.nom && <div>À l’attention de {client.nom}</div>}
          <div>{[client.adresse, [client.code_postal, client.ville].filter(Boolean).join(' '), client.pays].filter(Boolean).join(', ') || '—'}</div>
          {client.type_client === 'entreprise' && (
            <div>ICE : <b>{v(client.ice)}</b>{client.if_fiscal ? ` · IF : ${client.if_fiscal}` : ''}{client.rc ? ` · RC : ${client.rc}` : ''}</div>
          )}
          <div>N° d’abonné : <b style={{ fontFamily: 'monospace' }}>{fmtAbonne(client.numero_abonne || doc?.numero_abonne || avoir?.numero_abonne)}</b></div>
        </div>

        {/* Lignes */}
        <table className="l">
          <thead><tr><th>Désignation</th><th className="r">Qté</th><th className="r">P.U. HT</th><th className="r">Total HT</th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td>
                  {l.designation}
                  {kind === 'facture' && doc!.period_end && (
                    <div className="muted" style={{ fontSize: 11 }}>
                      Période : du {fmtDateLong(doc!.period_start)} au {fmtDateLong(doc!.period_end)}
                      {doc!.days_carried > 0 ? ` (dont ${doc!.days_carried} jours reportés de la période précédente)` : ''}
                    </div>
                  )}
                  {kind !== 'facture' && kind !== 'avoir' && <div className="muted" style={{ fontSize: 11 }}>Période de 12 mois à compter de la validation du paiement</div>}
                </td>
                <td className="r">{l.quantite} {l.unite}{l.quantite > 1 && l.unite === 'an' ? 's' : ''}</td>
                <td className="r">{fmtMAD(l.prix_unitaire_ht)}</td>
                <td className="r">{fmtMAD(l.total_ht)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <table style={{ marginLeft: 'auto', marginTop: 12, fontSize: 13, borderCollapse: 'collapse', minWidth: '45%' }}>
          <tbody>
            <tr><td style={{ padding: '4px 10px' }}>Total HT</td><td className="r" style={{ padding: '4px 10px' }}>{kind === 'avoir' ? '− ' : ''}{fmtMAD(ht)}</td></tr>
            <tr><td style={{ padding: '4px 10px' }}>TVA {rate} %</td><td className="r" style={{ padding: '4px 10px' }}>{kind === 'avoir' ? '− ' : ''}{fmtMAD(vat)}</td></tr>
            <tr style={{ background: '#0C2D5C', color: '#fff', fontWeight: 700 }}>
              <td style={{ padding: '7px 10px' }}>{kind === 'avoir' ? 'Total avoir TTC' : kind === 'facture' ? 'Total TTC payé' : 'Total TTC à payer'}</td>
              <td className="r" style={{ padding: '7px 10px' }}>{kind === 'avoir' ? '− ' : ''}{fmtMAD(ttc)}</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: 12, marginTop: 10 }}>
          Arrêtée la présente {kind === 'avoir' ? 'facture d’avoir' : kind === 'facture' ? 'facture' : 'facture pro-forma'} à la somme de : <b>{amountInWords(ttc)}</b> TTC.
        </p>

        {/* Paiement / mentions */}
        <div style={{ marginTop: 16, fontSize: 12, lineHeight: 1.6, borderTop: '1px solid #DDD', paddingTop: 10 }}>
          {kind === 'proforma' && <>
            <b>Mode de paiement : virement bancaire</b> — montant exact de {fmtMAD(ttc)}, référence <b style={{ fontFamily: 'monospace' }}>{fmtDocNumber(doc!.payment_reference)}</b> à indiquer dans le libellé.<br />
            Bénéficiaire : {v(issuer.titulaire_compte || issuer.raison_sociale)} · Banque : {v(issuer.banque)} · RIB : <span style={{ fontFamily: 'monospace' }}>{v(issuer.rib)}</span>{issuer.swift ? ` · SWIFT : ${issuer.swift}` : ''}<br />
            <span className="muted">Document provisoire sans valeur comptable. La facture définitive est émise à la validation du paiement ; l’abonnement court 12 mois à compter de cette date.</span>
          </>}
          {kind === 'facture' && <>
            <b>Mode de paiement : virement bancaire</b> — reçu et validé le {fmtDateLong(doc!.paid_at)}, référence {fmtDocNumber(doc!.payment_reference)}.
          </>}
          {kind === 'annulee' && <span className="muted">Pro-forma annulée le {fmtDateLong(doc!.cancelled_at)} — ne pas régler.</span>}
          {kind === 'avoir' && <>
            Avoir émis sur la facture <b>{avoir!.invoice_number}</b> du {fmtDateLong(avoir!.invoice_date)}. Motif : {avoir!.motif}.
            {avoir!.resiliation ? ' L’abonnement couvert par cette facture prend fin à la date de l’avoir.' : ''}
          </>}
        </div>

        {issuer.mentions_pied && <div className="muted" style={{ fontSize: 10, marginTop: 24, textAlign: 'center' }}>{issuer.mentions_pied}</div>}
      </div>
    </>
  )
}
