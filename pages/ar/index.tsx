// pages/ar/index.tsx — accueil en arabe (parcours clés) : le risque, la réponse, les offres, le diagnostic.
import Head from 'next/head'
import Link from 'next/link'
import SiteShell from '../../components/SiteShell'
import { AR_VALIDE } from '../../lib/ar'

const ALAM = [
  { t: 'التصنيف الموروث', d: '«صرّحنا دائمًا بهذا الرمز.» مرور التصريح لا يعني أن الرمز صحيح، ومسؤولية المصرّح قائمة إلى حين التقادم.' },
  { t: 'القيمة غير المكتملة', d: 'الأتاوات والعمولات وتكاليف النقل تُضاف إلى الثمن المؤدى. الجمارك لا تراقب فاتورتكم، بل تراقب قيمتكم في الجمرك.' },
  { t: 'المنشأ غير المُثبت', d: 'يُمنح النظام التعريفي التفضيلي عند التصريح ويُراجع بعده. شهادة ناقصة قد تعني أداء الرسوم كاملة عن سنة من العمليات.' },
  { t: 'حساب النظام الاقتصادي غير المُبرَأ', d: 'الرسوم الموقوفة دينٌ مؤجّل: حساب حلّ أجله دون إبراء يجعلها مستحقة، ويبقي الضمان مجمّدًا.' },
]

export default function AccueilAr() {
  return (
    <SiteShell lang="ar" title="Import-eXPert | الامتثال في الاستيراد بالمغرب" description="منصة تؤهّل عمليات الاستيراد وتحسب كلفتها وتؤمّنها قبل الاستخلاص الجمركي، مع ملف قابل للدفاع عنه عند المراقبة.">
      {!AR_VALIDE && <Head><meta name="robots" content="noindex, nofollow" /></Head>}
      <section className="x-hero">
        <div className="x-wrap">
          <div className="x-eyebrow">الامتثال في الاستيراد · المغرب</div>
          <h1 className="x-h1 x-h1-sm">ما ستراقبه الجمارك غدًا، <em>تحقّقوا منه اليوم</em>.</h1>
          <p className="x-lead">رمز النظام المنسق، المنشأ، القيمة، الكلفة الإجمالية، الوثائق: تؤهّل Import-eXPert كل عملية استيراد وتحسب كلفتها وتؤمّنها قبل الاستخلاص الجمركي، وتسلّمكم ملفًا قابلًا للدفاع عنه، كل نقطة فيه مستندة إلى النص الرسمي. ويحسم خبراؤنا الجمركيون الحالات الصعبة.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            <Link href="/ar/diagnostic" className="x-btn x-btn-dark">قيسوا درجة تعرّضكم</Link>
            <a href="/tools/enquete-barometre-ar.html" className="x-btn x-btn-line">شاركوا في بارومتر 2026</a>
          </div>
          <p className="x-note">حوالي 15 دقيقة، والنتائج تُعرض بالدرهم، وتبقى بياناتكم على جهازكم.</p>
        </div>
      </section>

      <section className="x-sec x-sec-white">
        <div className="x-wrap">
          <div className="x-eyebrow">الخطر الذي لا يُرى</div>
          <h2 className="x-h2">الخطأ لا يكلّف شيئًا يوم الاستخلاص الجمركي. <em>يكلّف لاحقًا</em>.</h2>
          <p className="x-sub"><b>23,5 مليار درهم</b>: هو مبلغ التصحيحات التي أجرتها إدارة الجمارك سنة 2025 بسبب التصريحات المزيفة فيما يخص القيمة، بزيادة 33 % في سنة واحدة (إدارة الجمارك والضرائب غير المباشرة، تقرير النشاط 2025). وتعتمد المراقبة اليوم على تحليل المخاطر وعلى المراقبة البعدية التي قد تشمل أربع سنوات من العمليات.</p>
          <div className="x-pf-grid x-pf-grid4">
            {ALAM.map(a => <div key={a.t} className="x-pf-card"><h3>{a.t}</h3><p>{a.d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="x-sec">
        <div className="x-wrap">
          <div className="x-eyebrow">الجواب</div>
          <h2 className="x-h2">اعرفوا، احسبوا، <em>أثبتوا</em>.</h2>
          <div className="x-pf-grid">
            <div className="x-pf-card" data-ton="navy"><h3>اعرفوا</h3><p>النص الدقيق والمحيَّن لكل سؤال: التعريفة، الدوريات، مدونة الجمارك، المدونة العامة للضرائب، الصرف. المساعد يذكر مصدره.</p></div>
            <div className="x-pf-card" data-ton="navy"><h3>احسبوا</h3><p>الكلفة الحقيقية لكل عملية استيراد، والمبالغ القابلة للاسترجاع بفضل الاتفاقيات والأنظمة الاقتصادية.</p></div>
            <div className="x-pf-card" data-ton="navy"><h3>أثبتوا</h3><p>ملف قابل للدفاع عنه، مؤرَّخ ومُسند إلى النصوص، لكل منتوج ولكل عملية، يمكن التحقق منه عبر الإنترنت. ويحسم الخبير حين يستدعي الرهان ذلك.</p></div>
          </div>
        </div>
      </section>

      <section className="x-sec x-sec-white">
        <div className="x-wrap x-two">
          <div>
            <div className="x-eyebrow">ما تحصلون عليه</div>
            <ul className="x-list">
              <li>بطاقة لكل منتوج: الرمز المعتمد، مقرر التصنيف التعريفي، المنشأ، الوثائق والرسوم</li>
              <li>ملف قابل للدفاع عنه، برقم وتاريخ وبصمة يمكن التحقق منها عبر الإنترنت</li>
              <li>رصد أسبوعي للنصوص الجديدة التي تمس رموز منتجاتكم</li>
              <li>تقرير شهري إلى المسيّر دون الحاجة إلى الدخول إلى المنصة</li>
            </ul>
          </div>
          <div className="x-ff">
            <div className="x-eyebrow">ابدأوا مجانًا</div>
            <p>العرض الاستكشافي مجاني: التشخيص، وثلاث بطاقات منتوج، ورصد النصوص التي تمسّها. وتجربة كاملة لمدة 14 يومًا دون وسيلة أداء.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/ar/inscription?plan=pro" className="x-btn x-btn-dark">تجربة 14 يومًا</Link>
              <Link href="/ar/tarifs" className="x-btn x-btn-line">العروض والأسعار</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
