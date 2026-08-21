import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Surestaries() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/tools/surestaries.html')
  }, [])
  return null
}
