// pages/ar/contact.tsx — formulaire de contact en arabe ; même envoi que la version française (/api/contact).
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import SiteShell from '../../components/SiteShell'
import { AR_VALIDE } from '../../lib/ar'
import { SUJETS_AR, titreFrancais } from '../../lib/sujetsContactAr'

export default function ContactAr() {
  const { query } = useRouter()
  const sujet = typeof query.sujet === 'string' && SUJETS_AR[query.sujet] ? query.sujet : null
  const [form, setForm] = useState({ nom: '', email: '', societe: '', telephone: '', msg: '' })
  const [sent, setSent] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (sujet) setForm(f => (f.msg ? f : { ...f, msg: SUJETS_AR[sujet].message })) }, [sujet])
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' }).then(r => (r.ok ? r.json() : null)).then(u => {
      if (u) setForm(f => ({ ...f, nom: f.nom || [u.prenom, u.nom].filter(Boolean).join(' '), email: f.email || u.email || '', societe: f.societe || u.societe || '' }))
    }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setEnvoi(true)
    try {
      const msg = form.msg + (form.telephone ? `\n\nTéléphone : ${form.telephone}` : '') + '\n\nLangue du visiteur : arabe (répondre de préférence en arabe)'
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: form.nom, email: form.email, societe: form.societe, msg,
          service: titreFrancais(sujet) ? `${titreFrancais(sujet)} (arabe)` : 'Contact (arabe)', source: sujet ? `ar-${sujet}` : 'ar-contact' }),
      })
      if (!res.ok) { setError('تعذّر إرسال الطلب. تحققوا من الحقول المطلوبة ثم أعيدوا المحاولة.'); setEnvoi(false); return }
      setSent(true)
    } catch { setError('خطأ في الاتصال، يرجى إعادة المحاولة.'); setEnvoi(false) }
  }

  return (
    <SiteShell lang="ar" title="اتصلوا بنا | IXP-Import-eXPert" description="تواصلوا مع خبراء Import-eXPert: لقاء مع خبير، باقة خبرة، عرض المؤسسات أو أي سؤال.">
      {!AR_VALIDE && <Head><meta name="robots" content="noindex, nofollow" /></Head>}
      <section className="x-hero">
        <div className="x-wrap" style={{ maxWidth: 720 }}>
          <div className="x-eyebrow">{sujet ? SUJETS_AR[sujet].titre : 'اتصلوا بنا'}</div>
          <h1 className="x-h1 x-h1-sm">{sent ? 'شكرًا، تم إرسال طلبكم.' : 'اتصلوا بنا'}</h1>
          {sent ? <p className="x-lead">يجيبكم خبير داخل يوم عمل واحد{sujet === 'echange-expert' ? ' لتحديد موعد اللقاء' : ''}، باللغة العربية أو الفرنسية حسب اختياركم.</p> : (
            <form onSubmit={handleSubmit} className="x-ff" style={{ marginTop: 18 }}>
              <div className="x-ff-grid">
                <label>الاسم *<input required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} /></label>
                <label>البريد الإلكتروني *<input required type="email" dir="ltr" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
                <label>الشركة<input value={form.societe} onChange={e => setForm({ ...form, societe: e.target.value })} /></label>
                <label>الهاتف{sujet === 'echange-expert' ? ' (للقاء)' : ''}<input type="tel" dir="ltr" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} /></label>
                <label className="wide">الرسالة *<textarea required rows={5} value={form.msg} onChange={e => setForm({ ...form, msg: e.target.value })} /></label>
              </div>
              {error && <p className="x-ff-err" style={{ marginTop: 12 }}>{error}</p>}
              <div className="x-ff-nav"><button type="submit" className="x-btn x-btn-dark" disabled={envoi}>{envoi ? 'جارٍ الإرسال…' : 'إرسال'}</button></div>
              <p className="x-ff-note">تُستعمل بياناتكم فقط للرد على هذا الطلب.</p>
            </form>)}
        </div>
      </section>
    </SiteShell>
  )
}
