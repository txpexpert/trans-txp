// pages/ar/tarifs.tsx — offres et prix en arabe (montants issus de lib/pricing.ts et lib/suite.ts).
import Head from 'next/head'
import Link from 'next/link'
import SiteShell from '../../components/SiteShell'
import { AR_VALIDE, chiffreAr } from '../../lib/ar'
import { PRICING } from '../../lib/pricing'
import { PACKS } from '../../lib/suite'

const PACKS_AR: Record<string, { nom: string; desc: string }> = {
  'Audit flash du classement': { nom: 'تدقيق سريع للتصنيف', desc: 'مراجعة 20 مرجعًا من طرف خبير، مع مذكرة مكتوبة بفوارق التصنيف والوثائق المطلوبة.' },
  'Bilan origine': { nom: 'حصيلة المنشأ', desc: 'ما تربحونه من اتفاقيات التبادل الحر، وما يمكن أن تربحوه، والإثباتات الواجب تأمينها، على مدى 12 شهرًا.' },
  'Préparation au contrôle a posteriori': { nom: 'التحضير للمراقبة البعدية', desc: 'مراجعة الملف، ونقاط الهشاشة، ولائحة الوثائق الواجب جمعها للرد على الإدارة.' },
  'Pré-OEA': { nom: 'التحضير لصفة المتعامل الاقتصادي المقبول', desc: 'الفارق بين وضعيتكم ومعايير الصفة، مع خارطة طريق للوصول إليها.' },
}

export default function TarifsAr() {
  const pro = PRICING.pro.annual!, prem = PRICING.premium.annual!
  const plans = [
    { nom: 'استكشافي', prix: 'مجانًا', pour: 'لتقييم المنصة', inclus: ['تشخيص الامتثال ودرجة التعرّض بالدرهم', '3 بطاقات منتوج ورصد شهري لمنتجاتكم', 'حساب كلفة الاستيراد'], href: '/auth/register?plan=free', cta: 'إنشاء حساب' },
    { nom: 'احترافي (Pro)', prix: `${chiffreAr(pro)} درهم`, pour: 'المقاولات الصغرى والمتوسطة المستوردة', inclus: ['50 مرجعًا متابَعًا وملفات قابلة للدفاع عنها', 'رصد أسبوعي وتقرير شهري إلى المسيّر', 'المكتبة كاملة والمساعد دون حدود'], href: '/auth/register?plan=pro', cta: 'تجربة 14 يومًا' },
    { nom: 'متميّز (Premium)', prix: `${chiffreAr(prem)} درهم`, pour: 'المعشرون والوكلاء والمكاتب', inclus: ['المراحل الخمس كاملة و120 مرجعًا متابَعًا', 'بوابة الزبناء باسمكم', '24 استشارة خبير في السنة، أي 36 000 درهم بسعر الاستشارة الواحدة'], href: '/auth/register?plan=premium', cta: 'تجربة 14 يومًا', vedette: true },
  ]
  return (
    <SiteShell lang="ar" title="العروض والأسعار | Import-eXPert" description="عروض Import-eXPert وأسعارها: استكشافي مجاني، احترافي ومتميّز، وباقات الخبرة.">
      {!AR_VALIDE && <Head><meta name="robots" content="noindex, nofollow" /></Head>}
      <section className="x-hero" style={{ paddingBottom: 24 }}>
        <div className="x-wrap">
          <div className="x-eyebrow">العروض والأسعار</div>
          <h1 className="x-h1 x-h1-sm">استوردوا بشكل صحيح، <em>وأثبتوا ذلك</em>.</h1>
          <p className="x-lead">الأسعار دون احتساب الرسوم، تُضاف إليها الضريبة على القيمة المضافة بنسبة 20 %. اشتراك سنوي يُؤدّى بتحويل بنكي، ويُفعَّل عند التحقق من الأداء.</p>
        </div>
      </section>
      <section className="x-sec-tight" style={{ paddingTop: 0 }}>
        <div className="x-wrap">
          <div className="x-plans">
            {plans.map(p => (
              <div key={p.nom} className={`x-plan ${p.vedette ? 'vedette' : ''}`}>
                <h3>{p.nom}</h3><p className="pour">{p.pour}</p>
                <div className="x-price">{p.prix}{p.prix !== 'مجانًا' && <small>دون احتساب الرسوم / السنة</small>}</div>
                <ul className="x-list">{p.inclus.map(t => <li key={t}>{t}</li>)}</ul>
                <Link href={p.href} className={`x-btn ${p.vedette ? 'x-btn-dark' : 'x-btn-line'}`} style={{ justifyContent: 'center' }}>{p.cta}</Link>
              </div>))}
          </div>
        </div>
      </section>
      <section className="x-sec">
        <div className="x-wrap">
          <div className="x-eyebrow">السعر مقارنةً بالخطر</div>
          <h2 className="x-h2">حوالي {chiffreAr(Math.round(pro / 365))} درهمًا في اليوم، <em>مقابل تصحيح واحد</em>.</h2>
          <p className="x-sub">لا يُقارَن الاشتراك بساعات العمل، بل بما يكلّفه خطأ واحد حين يُكتشف بعد ما قد يصل إلى أربع سنوات. وقد صحّحت الإدارة سنة 2025 ما قدره 23,5 مليار درهم بسبب التصريح بقيمة أقل من الحقيقية.</p>
        </div>
      </section>
      <section className="x-sec x-sec-white">
        <div className="x-wrap">
          <div className="x-eyebrow">باقات الخبرة</div>
          <h2 className="x-h2">تشخيص أول من طرف خبير، <em>يُخصم من اشتراككم</em>.</h2>
          <p className="x-sub">ثمن ثابت يُؤدّى بتحويل بنكي، ويُخصم من أول اشتراك سنوي إذا تم داخل أجل 30 يومًا.</p>
          <div className="x-presta">
            {PACKS.map(p => (
              <div key={p.nom}><h4>{PACKS_AR[p.nom]?.nom || p.nom}</h4><p className="x-tf-prix">{chiffreAr(p.prix)} درهم دون احتساب الرسوم</p><p>{PACKS_AR[p.nom]?.desc}</p></div>))}
          </div>
          <div style={{ marginTop: 24 }}><Link href="/tarifs" className="x-btn x-btn-dark">طلب باقة (بالفرنسية)</Link></div>
        </div>
      </section>
    </SiteShell>
  )
}
