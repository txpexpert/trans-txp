// lib/sujetsContactAr.ts — sujets du formulaire de contact en arabe (libellé et message préremplis).
// Le titre français accompagne la demande pour l'équipe ; la langue du visiteur est signalée.
import { SUJETS } from './sujetsContact'

export const SUJETS_AR: Record<string, { titre: string; message: string }> = {
  'echange-expert': { titre: 'لقاء لمدة 20 دقيقة مع خبير', message: 'أرغب في لقاء لمدة 20 دقيقة مع خبير لمراجعة نتيجة التشخيص.' },
  entreprise: { titre: 'عرض المؤسسات', message: 'أرغب في التواصل بشأن عرض المؤسسات لفريقنا.' },
  partenaire: { titre: 'برنامج الشركاء', message: 'أرغب في الانضمام إلى برنامج الشركاء والحصول على رابط باسمنا.' },
  'pack-expert': { titre: 'باقة الخبرة', message: 'أرغب في طلب باقة خبرة.' },
  presse: { titre: 'التواصل الصحفي', message: 'طلب صحفي بخصوص بارومتر 2026.' },
  'lf-2027': { titre: 'قانون المالية 2027', message: 'أرغب في حضور جلسة حول قانون المالية 2027 خاصة بمجال نشاطي.' },
}

export const titreFrancais = (sujet: string | null) => (sujet && SUJETS[sujet] ? SUJETS[sujet].titre : null)
