// components/WhatsAppLink.tsx — carte « IXP-Assistant sur WhatsApp » de Mon espace :
// relier son numéro (code à envoyer soi-même = consentement daté), ou le délier.
import { useEffect, useState } from 'react'

type Etat = { disponible: boolean; relie: boolean; numero: string | null; depuis: string | null; desinscrit: boolean }

export default function WhatsAppLink() {
  const [e, setE] = useState<Etat | null>(null)
  const [code, setCode] = useState<{ code: string; lien: string } | null>(null)
  const [msg, setMsg] = useState('')
  const charger = () => fetch('/api/whatsapp/lien', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)).then(setE).catch(() => {})
  useEffect(() => { charger() }, [])
  // Après l'envoi du code dans WhatsApp, l'abonné revient sur l'onglet : on rafraîchit l'état
  useEffect(() => {
    if (!code) return
    const f = () => { if (document.visibilityState === 'visible') charger() }
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
  }, [code])
  useEffect(() => { if (e?.relie) setCode(null) }, [e?.relie])

  if (!e?.disponible) return null

  async function generer() {
    setMsg('')
    const r = await fetch('/api/whatsapp/lien', { method: 'POST', credentials: 'same-origin' })
    const j = await r.json()
    if (!r.ok) return setMsg(j.error)
    setCode(j)
  }
  async function delier() {
    await fetch('/api/whatsapp/lien', { method: 'DELETE', credentials: 'same-origin' })
    setMsg('Numéro délié. Vous ne recevrez plus de messages WhatsApp.'); charger()
  }

  return (
    <div className="x-ff" id="whatsapp">
      <h3 style={{ margin: '0 0 6px' }}>IXP-Assistant sur WhatsApp</h3>
      {e.relie ? (
        <>
          <p className="x-ff-note" style={{ marginTop: 0 }}>
            Numéro relié : <b>{e.numero}</b>{e.depuis ? ` depuis le ${new Date(e.depuis).toLocaleDateString('fr-FR')}` : ''}.
            {e.desinscrit ? ' Vous avez écrit STOP : écrivez START sur WhatsApp pour réactiver les messages.' : ' Posez vos questions sur WhatsApp ; vous y recevez aussi les messages liés à votre abonnement.'}
          </p>
          <div className="x-ff-nav"><button type="button" className="x-btn x-btn-line x-btn-sm" onClick={delier}>Délier ce numéro</button></div>
        </>
      ) : (
        <>
          <p className="x-ff-note" style={{ marginTop: 0 }}>
            Posez vos questions à IXP-Assistant depuis WhatsApp et recevez-y les messages liés à votre abonnement (pro-forma, virement reçu, renouvellement). Écrivez STOP à tout moment pour arrêter.
          </p>
          {code ? (
            <p className="x-ff-note">
              Envoyez le message <b>IXP {code.code}</b> depuis votre WhatsApp (valable 15 minutes) :{' '}
              <a href={code.lien} target="_blank" rel="noopener noreferrer" className="x-btn x-btn-gold x-btn-sm">Ouvrir WhatsApp</a>
              <br /><small>En l’envoyant, vous acceptez de recevoir des messages d’Import-eXPert sur ce numéro (loi 09-08).</small>
            </p>
          ) : (
            <div className="x-ff-nav"><button type="button" className="x-btn x-btn-dark" onClick={generer}>Relier mon numéro WhatsApp</button></div>
          )}
        </>
      )}
      {msg && <p className="x-ff-note">{msg}</p>}
    </div>
  )
}
