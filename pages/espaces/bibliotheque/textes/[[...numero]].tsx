// /espaces/bibliotheque/textes            : recherche d'un texte officiel (numéro ou titre)
// /espaces/bibliotheque/textes/<numero>   : texte d'une circulaire (6165/313 → 6165-313)
// Recherche ouverte à tous ; texte complet réservé aux abonnés (contrôle serveur, lib/textesPage.ts).
import TextesOfficiels from '../../../../components/TextesOfficiels'
import { textesProps } from '../../../../lib/textesPage'

export default TextesOfficiels
export const getServerSideProps = textesProps('fr')
