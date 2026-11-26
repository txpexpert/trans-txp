// components/AppAndroid.tsx — encart de téléchargement de l'application Android (lien + QR code).
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.importexpert.app'

export default function AppAndroid() {
  return (
    <div className="x-app">
      <img className="x-app-qr" src="/brand/qr-import-expert-android.svg" width={88} height={88}
        alt="QR code pour télécharger l'application Import-eXPert sur Google Play" />
      <div className="x-app-txt">
        <div className="x-app-t">L’application Android</div>
        <p>Scannez le QR code ou</p>
        <a href={PLAY_URL} target="_blank" rel="noopener noreferrer" className="x-app-btn">Télécharger sur Google Play</a>
      </div>
    </div>
  )
}
