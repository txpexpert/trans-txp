// components/TextesOfficiels.tsx — Bibliothèque, module « Textes officiels ».
// Un champ « N° de circulaire ou titre » ; un numéro exact ouvre directement le texte, sinon la
// liste des résultats s'affiche à gauche et le texte au centre (même mise en page que les pages
// des étapes, classes x-esp-*). Recherche et liste ouvertes à tous ; le texte complet n'est
// envoyé au navigateur que pour un abonné (essai en cours, offre payante en cours ou
// administrateur, voir lib/compteAbonne.ts) : le contrôle est fait côté serveur (lib/textesPage.ts).
// Version française (/espaces/bibliotheque/textes/…) et version arabe (/ar/bibliotheque/textes/…) :
// même page, libellés selon la langue ; le texte lui-même reste dans sa langue d'origine.
import Link from 'next/link'
import SiteShell from './SiteShell'
import type { ResultatTexte } from '../lib/textesOfficiels'
import { CHEMIN_TEXTES, CHEMIN_TEXTES_AR, lienTexte, normNumero } from '../lib/textesLiens'

export type Lang = 'fr' | 'ar'
export type Entete = { numero: string; titre: string | null; type_document: string | null; date_document: string | null; emetteur: string | null; statut: string | null }
export type TextesProps = {
  lang: Lang
  q: string
  resultats: ResultatTexte[]
  entete: Entete | null
  texte: string | null              // null tant que le visiteur n'est pas abonné
  complet: boolean
  acces: 'abonne' | 'connexion' | 'abonnement' | null
  introuvable: boolean
  erreur: boolean
}

const MOIS = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'],
}
const STATUTS: Record<string, [string, string]> = {
  en_vigueur: ['En vigueur', 'ساري المفعول'], abroge: ['Abrogé', 'منسوخ'], modifie: ['Modifié', 'معدَّل'], historique: ['Référence historique', 'مرجع تاريخي'],
}
// Nature du texte (colonne type_document), terminologie du Code des douanes en arabe
const TYPES: Record<string, [string, string]> = {
  circulaire: ['Circulaire', 'دورية'], note: ['Note', 'مذكرة'], note_interne: ['Note interne', 'مذكرة داخلية'],
  arrete_ministeriel: ['Arrêté ministériel', 'قرار وزاري'], dahir_portant_loi: ['Dahir portant loi', 'ظهير شريف بمثابة قانون'],
  dahir: ['Dahir', 'ظهير شريف'], decret: ['Décret', 'مرسوم'], loi: ['Loi', 'قانون'], compilation: ['Compilation', 'تجميع'],
}
function typeLisible(t: string | null, lang: Lang): string {
  const v = TYPES[String(t || 'circulaire').toLowerCase()]
  return v ? v[lang === 'ar' ? 1 : 0] : String(t).replace(/_/g, ' ')
}
const court = (s: string, n = 90) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)
function statutLisible(s: string, lang: Lang): string {
  const v = STATUTS[String(s || '').toLowerCase()]
  return v ? v[lang === 'ar' ? 1 : 0] : String(s || '').replace(/_/g, ' ')
}
function dateLisible(d: string | null, lang: Lang): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d || ''))
  if (!m) return d || ''
  return `${Number(m[3])} ${MOIS[lang][Number(m[2]) - 1] || ''} ${m[1]}`
}

const L = {
  fr: {
    titre: 'Textes officiels', biblio: 'Bibliothèque', plateforme: 'Plateforme',
    champ: 'N° de circulaire ou titre', exemple: 'ex. 6165/313 ou cautionnement', chercher: 'Rechercher',
    resultats: 'Résultats', aucun: 'Aucun texte ne correspond à cette recherche. Essayez le numéro seul (ex. 6165/313) ou un mot du titre.',
    intro: 'Consultez le texte complet d’une circulaire à partir de son numéro ou de son titre.',
    intro2: 'Saisissez un numéro exact pour ouvrir directement le texte, ou quelques mots du titre pour obtenir la liste des textes correspondants. La recherche est ouverte à tous ; le texte complet est réservé aux abonnés.',
    avert: 'Texte consolidé — se référer au texte officiel de l’ADII',
    incomplet: 'Texte incomplet : certaines parties de ce texte ne sont pas encore disponibles dans la Bibliothèque. Reportez-vous au texte officiel publié par l’ADII.',
    circulaire: 'Circulaire', du: 'du', emetteur: 'Émetteur', statut: 'Statut', type: 'Type',
    reserve: 'Le texte complet est réservé aux abonnés.',
    reserve2: 'Il est inclus pendant l’essai gratuit et dans les offres payantes.',
    essai: 'Démarrer l’essai gratuit', offres: 'Voir les offres', connexion: 'Se connecter',
    renouveler: 'Votre compte ne donne pas accès au texte complet : il est inclus dans les offres payantes.',
    introuvableT: 'Texte introuvable', introuvable: 'Ce numéro ne correspond à aucun texte de la Bibliothèque. Lancez une recherche par numéro ou par titre.',
    erreur: 'Service momentanément indisponible, réessayez dans un instant.',
    assistant: 'Une question sur ce texte ?', assistantLien: 'IXP-Assistant', assistantFin: 'répond en citant le texte.',
  },
  ar: {
    titre: 'النصوص الرسمية', biblio: 'المكتبة', plateforme: 'الرئيسية',
    champ: 'رقم الدورية أو عنوانها', exemple: 'مثال: 6165/313 أو الضمان', chercher: 'بحث',
    resultats: 'النتائج', aucun: 'لا يوجد نص يطابق هذا البحث. جرّبوا الرقم وحده (مثال: 6165/313) أو كلمة من العنوان.',
    intro: 'اطّلعوا على النص الكامل لدورية انطلاقًا من رقمها أو عنوانها.',
    intro2: 'أدخلوا رقمًا دقيقًا لفتح النص مباشرة، أو بضع كلمات من العنوان للحصول على قائمة النصوص المطابقة. البحث متاح للجميع، والنص الكامل مخصّص للمشتركين.',
    avert: 'نص مُدمَج — يُرجى الرجوع إلى النص الرسمي لإدارة الجمارك والضرائب غير المباشرة',
    incomplet: 'نص غير كامل: بعض أجزاء هذا النص غير متوفرة بعد في المكتبة. يُرجى الرجوع إلى النص الرسمي الصادر عن إدارة الجمارك والضرائب غير المباشرة.',
    circulaire: 'دورية', du: 'بتاريخ', emetteur: 'الجهة المُصدِرة', statut: 'الوضعية', type: 'النوع',
    reserve: 'النص الكامل مخصّص للمشتركين.',
    reserve2: 'وهو متاح خلال التجربة المجانية وفي العروض المؤدّى عنها.',
    essai: 'ابدأوا التجربة المجانية', offres: 'العروض والأسعار', connexion: 'تسجيل الدخول',
    renouveler: 'لا يتيح حسابكم الاطلاع على النص الكامل: فهو متاح في العروض المؤدّى عنها.',
    introuvableT: 'النص غير موجود', introuvable: 'لا يطابق هذا الرقم أي نص في المكتبة. ابحثوا بالرقم أو بالعنوان.',
    erreur: 'الخدمة غير متاحة مؤقتًا، يُرجى إعادة المحاولة بعد لحظات.',
    assistant: 'سؤال حول هذا النص؟', assistantLien: 'IXP-Assistant', assistantFin: 'يجيب مع الإحالة على النص.',
  },
}

export default function TextesOfficiels({ lang, q, resultats, entete, texte, complet, acces, introuvable, erreur }: TextesProps) {
  const t = L[lang]
  const ar = lang === 'ar'
  const base = ar ? CHEMIN_TEXTES_AR : CHEMIN_TEXTES
  const accueilBiblio = '/espaces/bibliotheque'
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''
  const courant = entete ? normNumero(entete.numero) : ''
  const ici = entete ? lienTexte(entete.numero, ar) : base
  const liste = resultats.length ? resultats : (entete ? [{ numero: entete.numero, titre: entete.titre, type_document: entete.type_document, date_document: entete.date_document, nb_chunks: 0 }] : [])
  const nature = entete ? typeLisible(entete.type_document, lang) : ''
  const titrePage = entete ? `${nature} n° ${entete.numero}${entete.titre ? ' — ' + court(entete.titre, 80) : ''}` : t.titre

  return (
    <SiteShell lang={lang} title={`${titrePage} | IXP-Import-eXPert`}
      description={entete ? `${court(entete.titre || '', 200)} (${nature} n° ${entete.numero}${entete.date_document ? ' ' + t.du + ' ' + dateLisible(entete.date_document, lang) : ''}).` : t.intro}>
      <section className="x-sec-tight x-c-bibliotheque" style={{ paddingTop: 18 }}>
        <div className="x-wrap">
          <div className="x-crumb"><Link href={ar ? '/ar' : '/plateforme'}>{t.plateforme}</Link> / <Link href={accueilBiblio}>{t.biblio}</Link> / <Link href={base}>{t.titre}</Link></div>

          <form className="x-txt-form" method="get" action={base} target="_top" role="search">
            <label htmlFor="q-texte">{t.champ}</label>
            <div className="x-txt-champ">
              <input id="q-texte" name="q" type="search" defaultValue={q} placeholder={t.exemple} autoComplete="off" maxLength={120} required dir="auto" />
              <button type="submit" className="x-btn">{t.chercher}</button>
            </div>
          </form>

          <div className="x-esp">
            <aside className="x-esp-side" aria-label={t.resultats}>
              <div className="x-esp-side-hd"><span>{t.resultats}</span><span>{liste.length || ''}</span></div>
              {q && !liste.length && !erreur && <p className="x-txt-vide">{t.aucun}</p>}
              {liste.map(r => (
                <Link key={r.numero} href={lienTexte(r.numero, ar) + qs} className="x-esp-tile" aria-current={normNumero(r.numero) === courant ? 'true' : undefined}>
                  <span className="x-esp-n" dir="ltr">{r.numero}</span>
                  <span className="x-esp-tx"><b>{r.titre ? court(r.titre, 140) : `${typeLisible(r.type_document, lang)} n° ${r.numero}`}</b>{r.date_document && <small>{dateLisible(r.date_document, lang)}</small>}</span>
                </Link>
              ))}
            </aside>

            <div className="x-esp-centre">
              {erreur && <div className="x-txt-alerte" role="alert">{t.erreur}</div>}

              {introuvable && (
                <div className="x-esp-intro">
                  <div className="x-eyebrow">{t.titre}</div>
                  <h1 className="x-h1" style={{ fontSize: 'clamp(28px,3.4vw,42px)' }}>{t.introuvableT}</h1>
                  <p className="x-lead" style={{ margin: 0 }}>{t.introuvable}</p>
                </div>
              )}

              {!entete && !introuvable && (
                <div className="x-esp-intro">
                  <div className="x-eyebrow">{t.biblio}</div>
                  <h1 className="x-h1" style={{ fontSize: 'clamp(34px,4vw,52px)' }}>{t.titre}</h1>
                  <p className="x-lead" style={{ margin: 0 }}><strong style={{ fontWeight: 500, color: 'var(--x-ink)' }}>{t.intro}</strong> {t.intro2}</p>
                </div>
              )}

              {entete && (
                <article className="x-esp-outil x-txt">
                  <div className="x-txt-avert" role="note">{t.avert}</div>
                  <header className="x-txt-hd">
                    <div className="x-eyebrow">{nature} <span dir="ltr">n° {entete.numero}</span>{entete.date_document ? ` · ${t.du} ${dateLisible(entete.date_document, lang)}` : ''}</div>
                    <h1>{entete.titre || `${nature} n° ${entete.numero}`}</h1>
                    {(entete.emetteur || entete.statut) && (
                      <p className="x-txt-meta">
                        {entete.emetteur && <span><b>{t.emetteur}</b> {entete.emetteur}</span>}
                        {entete.statut && <span><b>{t.statut}</b> {statutLisible(entete.statut, lang)}</span>}
                      </p>
                    )}
                  </header>

                  {acces === 'abonne' && texte !== null && (
                    <>
                      {!complet && <div className="x-txt-incomplet" role="alert">⚠ {t.incomplet}</div>}
                      <div className="x-txt-corps" lang="fr" dir="ltr">
                        {texte.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
                      </div>
                    </>
                  )}

                  {acces !== 'abonne' && (
                    <div className="x-txt-verrou">
                      <b>{t.reserve}</b>
                      <p>{acces === 'abonnement' ? t.renouveler : t.reserve2}</p>
                      <div className="x-txt-actions">
                        {acces === 'connexion' && <a className="x-btn" href={ar ? '/ar/inscription' : '/auth/register'} target="_top">{t.essai}</a>}
                        <a className="x-btn x-btn-ghost" href={ar ? '/ar/tarifs' : '/tarifs'} target="_top">{t.offres}</a>
                        {acces === 'connexion' && <a className="x-txt-lien" href={`/auth/login?redirect=${encodeURIComponent(ici)}`} target="_top">{t.connexion} →</a>}
                      </div>
                    </div>
                  )}
                </article>
              )}

              <p className="x-note" style={{ margin: 0 }}>{t.assistant} <Link href={ar ? '/ar' : '/#assistant'} style={{ textDecoration: 'underline' }}>{t.assistantLien}</Link> {t.assistantFin}</p>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
