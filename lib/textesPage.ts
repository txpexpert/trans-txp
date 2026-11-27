// lib/textesPage.ts — getServerSideProps des pages « Textes officiels » (françaises et arabes).
// Côté serveur uniquement : importé seulement par getServerSideProps des pages, que Next retire
// du code envoyé au navigateur. Le texte complet n'est placé dans les props que pour un abonné.
import type { GetServerSideProps } from 'next'
import { compteAbonne } from './compteAbonne'
import { rechercherTextes, texteParSegment } from './textesOfficiels'
import { lienTexte, normNumero } from './textesLiens'
import type { Lang, TextesProps as Props } from '../components/TextesOfficiels'

/** getServerSideProps commun aux versions française et arabe. */
export function textesProps(lang: Lang): GetServerSideProps<Props> {
  return async ({ req, res, params, query }) => {
    // Réponse propre à chaque visiteur (abonné ou non) : jamais mise en cache partagé
    res.setHeader('Cache-Control', 'private, no-store')
    const ar = lang === 'ar'
    const seg = params?.numero
    const segments = Array.isArray(seg) ? seg : seg ? [String(seg)] : []
    if (segments.length > 1) return { notFound: true }
    const q = (typeof query.q === 'string' ? query.q : '').trim().slice(0, 120)

    const props: Props = { lang, q, resultats: [], entete: null, texte: null, complet: true, acces: null, introuvable: false, erreur: false }
    try {
      if (q) props.resultats = await rechercherTextes(q, 20)

      // Page de recherche : un numéro exact ouvre directement le texte
      if (!segments.length) {
        const exact = q && props.resultats.find(r => normNumero(r.numero) === normNumero(q))
        if (exact) return { redirect: { destination: `${lienTexte(exact.numero, ar)}?q=${encodeURIComponent(q)}`, permanent: false } }
        return { props }
      }

      const t = await texteParSegment(segments[0])
      if (!t) { res.statusCode = 404; props.introuvable = true; return { props } }
      props.entete = { numero: t.numero, titre: t.titre, type_document: t.type_document, date_document: t.date_document, emetteur: t.emetteur, statut: t.statut }
      props.complet = t.complet !== false

      // Contrôle d'accès côté serveur : le texte n'est placé dans la page que pour un abonné
      const compte = await compteAbonne(req as any)
      if (compte?.abonne) { props.acces = 'abonne'; props.texte = t.texte || '' }
      else props.acces = compte ? 'abonnement' : 'connexion'
      return { props }
    } catch (e: any) {
      console.error('[textes officiels]', e?.message || e)
      res.statusCode = 503
      props.erreur = true
      return { props }
    }
  }
}
