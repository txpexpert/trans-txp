// pages/ar/echange-expert.tsx — l'échange de 20 minutes avec un expert, en arabe.
import Link from 'next/link'
import Head from 'next/head'
import { useEffect } from 'react'
import SiteShell from '../../components/SiteShell'
import { AR_VALIDE } from '../../lib/ar'

export default function EchangeExpertAr() {
  useEffect(() => {
    fetch('/api/evenement', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ e: 'echange_vue' }) }).catch(() => {})
  }, [])
  return (
    <SiteShell lang="ar" title="لقاء لمدة 20 دقيقة مع خبير | IXP-Import-eXPert" description="بعد التشخيص، يراجع معكم خبير جمركي النتيجة ويحدد الإجراءات ذات الأولوية.">
      {!AR_VALIDE && <Head><meta name="robots" content="noindex, nofollow" /></Head>}
      <section className="x-hero">
        <div className="x-wrap" style={{ maxWidth: 820 }}>
          <div className="x-eyebrow">بعد التشخيص · مجانًا</div>
          <h1 className="x-h1 x-h1-sm">20 دقيقة مع خبير، <em>لتعرفوا من أين تبدؤون</em>.</h1>
          <p className="x-lead">يحسب التشخيص درجة تعرّضكم، واللقاء يحوّلها إلى قرارات: يراجع معكم خبير جمركي النتيجة ويحدد الإجراءين أو الثلاثة الأكثر تقليصًا لها.</p>
          <ul className="x-list" style={{ marginTop: 18 }}>
            <li>بالهاتف أو عبر الفيديو، داخل ثلاثة أيام عمل، بالعربية أو بالفرنسية</li>
            <li>الفوارق الحرجة في تشخيصكم، والنص الذي تستند إليه</li>
            <li>ما يمكنكم تصحيحه بأنفسكم، وما يستحق رأي خبير</li>
            <li>دون أي التزام</li>
          </ul>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
            <Link href="/ar/contact?sujet=echange-expert" className="x-btn x-btn-dark">اطلبوا اللقاء</Link>
            <Link href="/ar/diagnostic" className="x-btn x-btn-line">ابدؤوا بالتشخيص</Link>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
