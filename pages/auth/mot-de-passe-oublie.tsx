// pages/auth/mot-de-passe-oublie.tsx — demande d'un lien de réinitialisation du mot de passe (2026-11-14)
// Bilingue : arabe si ?langue=ar ou si l'interface arabe a été choisie (cookie ixp_lang).
import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import AuthCarte, { useLangueAuth } from '../../components/AuthCarte'

const T = {
  fr: { titre: 'Mot de passe oublié', sous: 'Recevez un lien pour choisir un nouveau mot de passe', email: 'EMAIL DU COMPTE', envoi: 'ENVOI…', bouton: 'RECEVOIR LE LIEN →', retour: 'Retour à la connexion', erreur: 'Demande impossible.', reseau: 'Erreur réseau — réessayez.' },
  ar: { titre: 'نسيتم كلمة المرور؟', sous: 'توصلوا برابط لاختيار كلمة مرور جديدة', email: 'البريد الإلكتروني للحساب', envoi: 'جارٍ الإرسال…', bouton: 'إرسال الرابط', retour: 'العودة إلى تسجيل الدخول', erreur: 'تعذّر تنفيذ الطلب.', reseau: 'خطأ في الشبكة، يُرجى إعادة المحاولة.' },
}

export default function MotDePasseOublie() {
  const langue = useLangueAuth()
  const t = T[langue]
  const [email, setEmail] = useState('')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo]   = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const r = await fetch('/api/auth/mot-de-passe-oublie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, langue }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) setInfo(d.message || '✓')
      else setError(d.error || t.erreur)
    } catch { setError(t.reseau) } finally { setBusy(false) }
  }

  return (
    <AuthCarte titre={t.titre} sousTitre={t.sous} langue={langue}>
      {info ? <div className="ok">{info}</div> : (
        <form onSubmit={submit}>
          {error && <div className="err">⚠ {error}</div>}
          <div className="field">
            <label className="label" htmlFor="email">{t.email}</label>
            <input id="email" className="inp" type="email" dir="ltr" placeholder="vous@entreprise.ma" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <button type="submit" className="btn" disabled={busy}>{busy ? t.envoi : t.bouton}</button>
        </form>
      )}
      <div className="lien"><Link href="/auth/login">{t.retour}</Link></div>
    </AuthCarte>
  )
}
