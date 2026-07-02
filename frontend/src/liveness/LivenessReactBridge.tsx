/** @jsxImportSource react */
import React from 'react';
import { FaceLivenessDetector, type LivenessDisplayText } from '@aws-amplify/ui-react-liveness';
import { Amplify } from 'aws-amplify';

interface LivenessReactBridgeProps {
  sessionId: string;
  region: string;
  onComplete: (sessionId: string) => void;
  onError: (error: Error) => void;
}

Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      allowGuestAccess: true,
    }
  }
});

const displayText: LivenessDisplayText = {
  cameraMinSpecificationsHeadingText: 'Kamera tidak memenuhi spesifikasi minimum',
  cameraMinSpecificationsMessageText: 'Kamera harus mendukung resolusi minimal 320*240 dan 15 frame per detik.',
  cameraNotFoundHeadingText: 'Kamera tidak dapat diakses.',
  cameraNotFoundMessageText: 'Pastikan kamera terhubung dan tidak ada aplikasi lain yang menggunakannya. Anda mungkin perlu masuk ke pengaturan untuk memberikan izin kamera dan menutup semua instance browser lalu coba lagi.',
  a11yVideoLabelText: 'Webcam untuk pemeriksaan liveness',
  cancelLivenessCheckText: 'Batalkan pemeriksaan liveness',
  goodFitCaptionText: 'Posisi pas',
  goodFitAltText: "Ilustrasi wajah seseorang yang pas di dalam oval.",
  hintCenterFaceText: 'Pusatkan wajah Anda',
  hintCenterFaceInstructionText: 'Instruksi: Sebelum memulai pemeriksaan, pastikan kamera berada di bagian atas tengah layar dan pusatkan wajah Anda ke kamera. Saat pemeriksaan dimulai, oval akan muncul di tengah. Anda akan diminta untuk bergerak maju ke dalam oval lalu diminta untuk tetap diam. Setelah diam beberapa detik, Anda akan mendengar pemeriksaan selesai.',
  hintFaceOffCenterText: 'Wajah tidak berada di dalam oval, pusatkan wajah Anda ke kamera.',
  hintMoveFaceFrontOfCameraText: 'Letakkan wajah di depan kamera',
  hintTooManyFacesText: 'Pastikan hanya satu wajah di depan kamera',
  hintFaceDetectedText: 'Wajah terdeteksi',
  hintCanNotIdentifyText: 'Letakkan wajah di depan kamera',
  hintTooCloseText: 'Menjauh',
  hintTooFarText: 'Mendekat',
  hintConnectingText: 'Menghubungkan...',
  hintVerifyingText: 'Memverifikasi...',
  hintCheckCompleteText: 'Pemeriksaan selesai',
  hintIlluminationTooBrightText: 'Pindah ke tempat lebih redup',
  hintIlluminationTooDarkText: 'Pindah ke tempat lebih terang',
  hintIlluminationNormalText: 'Pencahayaan normal',
  hintHoldFaceForFreshnessText: 'Tetap diam',
  hintMatchIndicatorText: '50% selesai. Terus mendekat.',
  photosensitivityWarningBodyText: 'Pemeriksaan ini akan menampilkan kilatan warna yang berbeda. Berhati-hatilah jika Anda sensitif terhadap cahaya.',
  photosensitivityWarningHeadingText: 'Peringatan fotosensitivitas',
  photosensitivityWarningInfoText: 'Beberapa orang mungkin mengalami kejang epilepsi saat terpapar cahaya berwarna. Berhati-hatilah jika Anda atau anggota keluarga Anda memiliki kondisi epilepsi.',
  photosensitivityWarningLabelText: 'Informasi lebih lanjut tentang fotosensitivitas',
  retryCameraPermissionsText: 'Coba lagi',
  recordingIndicatorText: 'Rec',
  startScreenBeginCheckText: 'Mulai pemeriksaan video',
  tooFarCaptionText: 'Terlalu jauh',
  tooFarAltText: "Ilustrasi wajah seseorang di dalam oval; terdapat jarak antara wajah dan batas oval.",
  waitingCameraPermissionText: 'Menunggu izin kamera dari Anda.',
  errorLabelText: 'Error',
  connectionTimeoutHeaderText: 'Koneksi waktu habis',
  connectionTimeoutMessageText: 'Koneksi telah waktu habis.',
  timeoutHeaderText: 'Waktu habis',
  timeoutMessageText: 'Wajah tidak pas di dalam oval dalam batas waktu. Coba lagi dan penuhi oval sepenuhnya dengan wajah Anda.',
  faceDistanceHeaderText: 'Pergerakan maju terdeteksi',
  faceDistanceMessageText: 'Hindari bergerak maju saat menghubungkan.',
  multipleFacesHeaderText: 'Multiple wajah terdeteksi',
  multipleFacesMessageText: 'Pastikan hanya satu wajah di depan kamera saat menghubungkan.',
  clientHeaderText: 'Error klien',
  clientMessageText: 'Pemeriksaan gagal karena masalah klien',
  serverHeaderText: 'Masalah server',
  serverMessageText: 'Tidak dapat menyelesaikan pemeriksaan karena masalah server',
  landscapeHeaderText: 'Orientasi landscape tidak didukung',
  landscapeMessageText: 'Putar perangkat Anda ke orientasi portrait (vertikal).',
  portraitMessageText: 'Pastikan perangkat Anda tetap dalam orientasi portrait (vertikal) selama pemeriksaan.',
  tryAgainText: 'Coba lagi',
};

export const LivenessReactBridge: React.FC<LivenessReactBridgeProps> = ({
  sessionId,
  region,
  onComplete,
  onError,
}) => {
  return (
    <FaceLivenessDetector
      sessionId={sessionId}
      region={region}
      displayText={displayText}
      onAnalysisComplete={async () => {
        onComplete(sessionId);
      }}
      onError={(err) => {
        onError(err instanceof Error ? err : new Error(err.message || 'Liveness error'));
      }}
    />
  );
};
