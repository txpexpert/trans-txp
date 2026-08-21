import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function TicReference() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/tools/tic_reference.html')
  }, [])
  return null
}
