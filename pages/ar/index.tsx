// pages/ar/index.tsx — accueil en arabe (parcours clés) : le risque, la réponse, les offres, le diagnostic.
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SiteShell from '../../components/SiteShell'
import { AR_VALIDE } from '../../lib/ar'

// Rubrique « الخطر الذي لا يُرى » : الاستيراد في مجمله (المنتوج، الشراء، الكلفة، اللوجستيك، الصرف والأداء، الرصد)،
// والجمارك وظيفة من بين وظائفه (قاعدة الموقع، نونبر 2026 ; مطابقة للنسخة الفرنسية).
const ALAM = [
  { t: '«منتوجكم مطابق لدى مورّدكم، لكن ليس بالضرورة في المغرب.»', d: 'تحقّقوا من المعايير والمراقبات التقنية والرخص والوسم.', e: 'التأهيل · بطاقة المنتوج' },
  { t: '«المورّد الأرخص ليس دائمًا الشراء الأرخص.»', d: 'بلد المنشأ، اتفاقية التبادل الحر، الآجال، شروط الأداء: بالثمن نفسه، يغيّر اختيار المورّد الكلفة النهائية والمخاطر.', e: 'التحسين · الشراء والمنشأ والاتفاقيات' },
  { t: '«استيرادكم يكلّف أكثر من فاتورتكم.»', d: 'الشحن، التأمين، الصرف، الرسوم والضرائب، الخزن، التمويل: كلفة إجمالية مقدّرة بأقل من حقيقتها تُفسد هامش تشكيلة كاملة من المنتوجات.', e: 'الحساب · سعر الكلفة' },
  { t: '«شرط التسليم (Incoterm) الموقَّع يحدد من يؤدي حين يسوء النقل.»', d: 'عوار، تأخير في الميناء، غرامات تأخير السفن، تأمين غير كافٍ: شرط تسليم سيئ الاختيار يحمّلكم مصاريف ومخاطر لا تتحكمون فيها.', e: 'التنفيذ · اللوجستيك والنقل' },
  { t: '«أداء ثمن مورّد أجنبي هو أيضًا عملية صرف.»', d: 'التوطين البنكي، الوثائق المطلوبة، آجال الأداء، تقلّب سعر الصرف: أداء غير مُعدّ جيدًا يؤخّر الطلبية ويقلّص الهامش.', e: 'التأمين · الصرف والأداء' },
  { t: '«تكتشفون التغيير حين تكون البضاعة في الطريق.»', d: 'قانون المالية، سعر صرف الدرهم، التدابير التجارية، أسعار الشحن: دون رصد، تتخذ الإدارة قراراتها متأخرة.', e: 'القيادة · الاستعلام والاستراتيجية' },
]

export default function AccueilAr() {
  const { query } = useRouter()
  const verifie = query.verified === '1'
  return (
    <SiteShell lang="ar" title="Import-eXPert | الامتثال وتحسين عمليات الاستيراد" description="أهّلوا كل عملية استيراد واحسبوا كلفتها وأمّنوها قبل الشروع فيها: المنتوج، الشراء، التصنيف وفق النظام المنسق، المنشأ، الكلفة الإجمالية، اللوجستيك، الصرف والامتثال.">
      {!AR_VALIDE && <Head><meta name="robots" content="noindex, nofollow" /></Head>}
      {verifie && (
        <div className="x-wrap" style={{ marginTop: 18 }}>
          <p className="x-ff-ok" role="status">تم تأكيد بريدكم الإلكتروني وتفعيل حسابكم. يمكنكم الآن <Link href="/mon-espace">الدخول إلى فضائكم</Link> (بالفرنسية) أو <Link href="/ar/diagnostic">البدء بالتشخيص</Link>.</p>
        </div>
      )}
      <section className="x-hero">
        <div className="x-wrap">
          <div className="x-eyebrow">الامتثال في الاستيراد · المغرب</div>
          <h1 className="x-h1 x-h1-sm">ما ستراقبه الإدارات غدًا، <em>تحقّقوا منه اليوم</em>.</h1>
          <p className="x-lead">المنتوج، المورّد، الكلفة الإجمالية، النقل، الأداء، الامتثال: تؤهّل Import-eXPert كل عملية استيراد وتحسب كلفتها وتؤمّنها قبل إصدار الطلبية، وتسلّمكم ملفًا قابلًا للدفاع عنه، كل نقطة فيه مستندة إلى النص الرسمي. ويحسم خبراؤنا في مسار الاستيراد الحالات الصعبة.</p>
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
          <h2 className="x-h2">خطأ الاستيراد لا يظهر <em>يوم وصول البضاعة</em>.</h2>
          <p className="x-sub">بل يظهر لاحقًا: في الهامش، أو عند نزاع مع المورّد، أو تأخّر في التسليم، أو أداء معلّق، أو مراقبة، حين تكون البضاعة قد بيعت منذ مدة. فنجاح الاستيراد يتحقق على امتداد السلسلة كلها: المنتوج، والشراء، والكلفة الإجمالية، واللوجستيك، والصرف والأداء، والامتثال.</p>
          <p className="x-sub">مثال من بين أمثلة أخرى: <b>23,5 مليار درهم</b> من التصحيحات أجرتها إدارة الجمارك سنة 2025 بسبب التصريحات المزيفة فيما يخص القيمة، بزيادة 33 % في سنة واحدة (إدارة الجمارك والضرائب غير المباشرة، تقرير النشاط 2025).</p>
          <div className="x-pf-grid">
            {ALAM.map(a => <div key={a.t} className="x-pf-card"><h3>{a.t}</h3><p>{a.d}</p><p className="x-mono" style={{ fontSize: 12, color: 'var(--x-ink3)', marginTop: 8 }}>{a.e}</p></div>)}
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
