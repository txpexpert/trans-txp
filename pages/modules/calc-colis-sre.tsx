import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function CalcColisSre() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/tools/calc-colis-sre-v3.html')
  }, [])
  return null
}
