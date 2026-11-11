// pages/ar/inscription.tsx — création de compte en arabe ; même inscription que /auth/register.
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SiteShell from '../../components/SiteShell'

const PROFILS = [
  { value: 'transitaire', label: 'معشر في الجمرك' },
  { value: 'importateur', label: 'مستورد أو مصدّر (مقاولة صغرى أو متوسطة)' },
  { value: 'directeur_logistique', label: 'مدير اللوجستيك' },
  { value: 'consultant', label: 'مكتب استشارة جمركية' },
  { value: 'autre', label: 'آخر' },
]

const OFFRES: Record<string, string> = { free: 'العرض الاستكشافي (مجاني)', pro: 'تجربة عرض Pro لمدة 14 يومًا', premium: 'تجربة عرض Premium لمدة 14 يومًا' }

export default function InscriptionAr() {
  const router = useRouter()
  const plan = typeof router.query.plan === 'string' ? router.query.plan : undefined
  const [form, setForm] = useState({ email: '', password: '', confirm: '', nom: '', prenom: '', societe: '', telephone: '', profil: 'importateur' })
  const [cgu, setCgu] = useState(false)
  const [inscrit, setInscrit] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('البريد الإلكتروني وكلمة المرور مطلوبان.'); return }
    if (form.password.length < 8) { setError('كلمة المرور قصيرة جدًا (8 أحرف على الأقل).'); return }
    if (form.password !== form.confirm) { setError('كلمتا المرور غير متطابقتين.'); return }
    if (!cgu) { setError('يجب قبول شروط الاستعمال وسياسة السرية للمتابعة.'); return }
    setEnvoi(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, nom: form.nom, prenom: form.prenom, societe: form.societe, telephone: form.telephone, profil: form.profil, plan, langue: 'ar' }),
      })
      if (!res.ok) {
        setError(res.status === 409 ? 'هذا البريد الإلكتروني مستعمل بالفعل. سجّلوا الدخول أو استعملوا بريدًا آخر.'
          : res.status === 403 ? 'عناوين البريد الإلكتروني الحكومية (.gov.ma) غير مقبولة لهذا الاشتراك.'
          : 'تعذّر إنشاء الحساب. يرجى إعادة المحاولة.')
        setEnvoi(false); return
      }
      setInscrit(true)
    } catch { setError('خطأ في الاتصال، يرجى إعادة المحاولة.'); setEnvoi(false) }
  }

  return (
    <SiteShell lang="ar" title="إنشاء حساب | IXP-Import-eXPert" description="أنشئوا حسابكم على Import-eXPert: العرض الاستكشافي مجاني، وتجربة كاملة لمدة 14 يومًا دون وسيلة أداء.">
      <section className="x-hero">
        <div className="x-wrap" style={{ maxWidth: 720 }}>
          {inscrit ? (
            <>
              <div className="x-eyebrow">الخطوة الأخيرة</div>
              <h1 className="x-h1 x-h1-sm">تحققوا من بريدكم الإلكتروني.</h1>
              <p className="x-lead">أرسلنا رسالة تأكيد إلى <b dir="ltr">{form.email}</b>. اضغطوا على الرابط الذي تتضمنه لتفعيل حسابكم{plan === 'free' ? '' : ' وبدء التجربة المجانية لمدة 14 يومًا'}.</p>
              <p className="x-note">إن لم تصلكم بعد بضع دقائق، تحققوا من البريد غير المرغوب فيه، أو <Link href="/auth/login">سجّلوا الدخول</Link> لطلب إرسالها من جديد.</p>
            </>
          ) : (
            <>
              <div className="x-eyebrow">{plan && OFFRES[plan] ? OFFRES[plan] : 'تجربة كاملة لمدة 14 يومًا، دون وسيلة أداء'}</div>
              <h1 className="x-h1 x-h1-sm">انضموا إلى <em>Import-eXPert</em>.</h1>
              <form onSubmit={submit} className="x-ff" style={{ marginTop: 18 }}>
                <div className="x-ff-grid">
                  <label>الاسم الشخصي<input value={form.prenom} onChange={set('prenom')} autoComplete="given-name" /></label>
                  <label>الاسم العائلي<input value={form.nom} onChange={set('nom')} autoComplete="family-name" /></label>
                  <label className="wide">البريد الإلكتروني المهني *<input required type="email" dir="ltr" value={form.email} onChange={set('email')} autoComplete="email" placeholder="nom@entreprise.ma" /></label>
                  <label>الشركة أو المكتب<input value={form.societe} onChange={set('societe')} autoComplete="organization" /></label>
                  <label>الهاتف<input type="tel" dir="ltr" value={form.telephone} onChange={set('telephone')} autoComplete="tel" placeholder="06 12 34 56 78" /></label>
                  <label className="wide">مجال النشاط<select value={form.profil} onChange={set('profil')}>{PROFILS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></label>
                  <label>كلمة المرور *<input required type="password" dir="ltr" value={form.password} onChange={set('password')} autoComplete="new-password" placeholder="8 أحرف على الأقل" /></label>
                  <label>تأكيد كلمة المرور *<input required type="password" dir="ltr" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" /></label>
                  <label className="wide x-ff-chk"><input type="checkbox" checked={cgu} onChange={e => setCgu(e.target.checked)} /><span>أوافق على <Link href="/cgu" target="_blank">شروط الاستعمال</Link> و<Link href="/confidentialite" target="_blank">سياسة السرية</Link> (بالفرنسية)</span></label>
                </div>
                {error && <p className="x-ff-err" style={{ marginTop: 12 }}>{error}</p>}
                <div className="x-ff-nav"><button type="submit" className="x-btn x-btn-dark" disabled={envoi}>{envoi ? 'جارٍ إنشاء الحساب…' : plan === 'free' ? 'إنشاء حسابي' : 'ابدؤوا التجربة المجانية'}</button></div>
                <p className="x-ff-note">لديكم حساب؟ <Link href="/auth/login">سجّلوا الدخول</Link>. تبقى واجهة الحساب حاليًا باللغة الفرنسية.</p>
              </form>
              <ul className="x-list" style={{ marginTop: 22 }}>
                <li>تشخيص الامتثال ودرجة التعرّض بالدرهم</li>
                <li>بطاقة لكل منتوج: الرمز، المنشأ، الوثائق والرسوم</li>
                <li>رصد النصوص الجديدة التي تمس منتجاتكم</li>
                <li>ملفات قابلة للدفاع عنها يمكن التحقق منها عبر الإنترنت</li>
              </ul>
            </>
          )}
        </div>
      </section>
    </SiteShell>
  )
}
