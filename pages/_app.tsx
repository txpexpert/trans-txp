import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import '../styles/globals.css'
import '../styles/site.css'
import { AuthProvider } from '../context/AuthContext'
import SiteShell from '../components/SiteShell'

// Toutes les pages du site partagent l'en-tête (logo IXP, navigation) et le pied de page de la
// page « Présentation de notre plateforme en 5 espaces ». Les pages de la vitrine appellent
// SiteShell elles-mêmes ; les autres sont enveloppées ici.
// Hors champ : l'application mobile (/app, /mobile), qui a sa propre navigation, et le back-office.
const OWN_SHELL = new Set(['/', '/plateforme', '/expertise', '/tarifs', '/espaces/[slug]'])
const NO_SHELL = /^\/(app|mobile|backoffice|_error|404|500)(\/|$)/

export default function App({ Component, pageProps }: AppProps) {
  const { pathname } = useRouter()
  const page = <Component {...pageProps} />
  const wrap = !OWN_SHELL.has(pathname) && !NO_SHELL.test(pathname)
  return (
    <AuthProvider>
      {wrap ? <SiteShell title="IXP-Import-eXPert" plain>{page}</SiteShell> : page}
    </AuthProvider>
  )
}
