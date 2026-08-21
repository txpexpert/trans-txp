import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function RegimeChange() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/tools/regime_de_change.html')
  }, [])
  return null
}
