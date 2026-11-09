import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function OperateursMaritimes() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/tools/operateurs-maritimes.html')
  }, [])
  return null
}
