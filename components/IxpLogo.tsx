// components/IxpLogo.tsx — logo IXP (carré bleu marine), utilisé dans les en-têtes et le hero.
export default function IxpLogo({ size = 36, className = '' }: { size?: number; className?: string }) {
  const src = size > 64 ? '/brand/ixp-logo-256.png' : '/brand/ixp-logo-128.png'
  return <img src={src} width={size} height={size} alt="IXP Import-eXPert" data-ixp-logo="" className={`ixp-logo-img ${className}`} />
}
