// Version arabe de la Bibliothèque « Textes officiels » (/ar/bibliotheque/textes/<numero>).
// Mêmes données et même contrôle d'accès que la version française ; le texte reste en français.
import TextesOfficiels from '../../../../components/TextesOfficiels'
import { textesProps } from '../../../../lib/textesPage'

export default TextesOfficiels
export const getServerSideProps = textesProps('ar')
