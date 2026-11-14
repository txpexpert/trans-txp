// pages/auth/reinitialiser.tsx — choix d'un nouveau mot de passe depuis le lien reçu par email (2026-11-14)
// Bilingue : arabe si ?langue=ar (lien de l'email arabe) ou cookie ixp_lang=ar.
import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AuthCarte, { useLangueAuth } from '../../components/AuthCarte'

const MIN = 12

const T = {
  fr: {
    titre: 'Nouveau mot de passe', sous: 'Compte Import-eXPert', verif: 'Vérification du lien…',
    invalide: 'Ce lien est invalide, déjà utilisé ou expiré (validité : 1 heure).', nouveauLien: 'Demander un nouveau lien',
    fait: 'Votre mot de passe a été modifié. Toutes les sessions ouvertes ont été fermées : connectez-vous avec votre nouveau mot de passe.',
    connexion: 'SE CONNECTER →', nouveau: 'NOUVEAU MOT DE PASSE', confirmer: 'CONFIRMER',
    aide: `${MIN} caractères minimum, avec au moins une lettre et un chiffre. Une phrase de plusieurs mots est idéale.`,
    differents: 'Les deux mots de passe ne correspondent pas.', enreg: 'ENREGISTREMENT…', bouton: 'ENREGISTRER →',
    erreur: 'Enregistrement impossible.', reseau: 'Erreur réseau — réessayez.',
  },
  ar: {
    titre: 'كلمة مرور جديدة', sous: 'حساب Import-eXPert', verif: 'جارٍ التحقق من الرابط…',
    invalide: 'هذا الرابط غير صالح أو سبق استعماله أو انتهت صلاحيته (مدة الصلاحية: ساعة واحدة).', nouveauLien: 'طلب رابط جديد',
    fait: 'تم تغيير كلمة المرور. أُغلقت جميع الجلسات المفتوحة: سجّلوا الدخول بكلمة المرور الجديدة.',
    connexion: 'تسجيل الدخول', nouveau: 'كلمة المرور الجديدة', confirmer: 'تأكيد كلمة المرور',
    aide: `${MIN} حرفًا على الأقل، مع حرف واحد ورقم واحد على الأقل. يُستحسن استعمال جملة من عدة كلمات.`,
    differents: 'كلمتا المرور غير متطابقتين.', enreg: 'جارٍ الحفظ…', bouton: 'حفظ',
    erreur: 'تعذّر الحفظ.', reseau: 'خطأ في الشبكة، يُرجى إعادة المحاولة.',
  },
}

export default function Reinitialiser() {
  const router = useRouter()
  const langue = useLangueAuth()
  const t = T[langue]
  const q = langue === 'ar' ? '?langue=ar' : ''
  const token = typeof router.query.token === 'string' ? router.query.token : ''
  const [etat, setEtat]   = useState<'verif' | 'form' | 'invalide' | 'fait'>('verif')
  const [mdp, setMdp]     = useState('')
  const [mdp2, setMdp2]   = useState('')
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    if (!token) { setEtat('invalide'); return }
    fetch(`/api/auth/reinitialiser?token=${encodeURIComponent(token)}`)
      .then(r => setEtat(r.ok ? 'form' : 'invalide'))
      .catch(() => setEtat('invalide'))
  }, [router.isReady, token])

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError('')
    if (mdp !== mdp2) { setError(t.differents); return }
    setBusy(true)
    try {
      const r = await fetch('/api/auth/reinitialiser', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, nouveau: mdp, langue }) })
      const d = await r.json().catch(() => ({}))
      if (r.ok) setEtat('fait')
      else if (r.status === 404) setEtat('invalide')
      else setError(d.error || t.erreur)
    } catch { setError(t.reseau) } finally { setBusy(false) }
  }

  return (
    <AuthCarte titre={t.titre} sousTitre={t.sous} langue={langue}>
      {etat === 'verif' && <p style={{ fontSize: 13, color: 'var(--ink3)' }}>{t.verif}</p>}
      {etat === 'invalide' && (
        <>
          <div className="err">⚠ {t.invalide}</div>
          <div className="lien"><Link href={`/auth/mot-de-passe-oublie${q}`}>{t.nouveauLien}</Link></div>
        </>
      )}
      {etat === 'fait' && (
        <>
          <div className="ok">{t.fait}</div>
          <Link href="/auth/login"><button type="button" className="btn">{t.connexion}</button></Link>
        </>
      )}
      {etat === 'form' && (
        <form onSubmit={submit}>
          {error && <div className="err">⚠ {error}</div>}
          <div className="field">
            <label className="label" htmlFor="mdp">{t.nouveau}</label>
            <input id="mdp" className="inp" type="password" dir="ltr" value={mdp} onChange={e => setMdp(e.target.value)} autoComplete="new-password" minLength={MIN} required />
          </div>
          <p className="aide">{t.aide}</p>
          <div className="field">
            <label className="label" htmlFor="mdp2">{t.confirmer}</label>
            <input id="mdp2" className="inp" type="password" dir="ltr" value={mdp2} onChange={e => setMdp2(e.target.value)} autoComplete="new-password" minLength={MIN} required />
          </div>
          <button type="submit" className="btn" disabled={busy}>{busy ? t.enreg : t.bouton}</button>
        </form>
      )}
    </AuthCarte>
  )
}
