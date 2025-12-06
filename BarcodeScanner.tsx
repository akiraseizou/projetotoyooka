import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "reader";

  useEffect(() => {
    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          const cameraId = devices[devices.length - 1].id; // Prefer back camera usually last
          const html5QrCode = new Html5Qrcode(containerId);
          scannerRef.current = html5QrCode;
          
          await html5QrCode.start(
            cameraId, 
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              onScan(decodedText);
              onClose(); // Auto close on success
            },
            (errorMessage) => {
              // ignore frame errors
            }
          );
        } else {
          setError('Nenhuma câmera encontrada.');
        }
      } catch (err) {
        setError('Erro ao iniciar câmera. Verifique permissões.');
        console.error(err);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(err => console.error(err));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg overflow-hidden relative">
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"
        >
          <X className="w-6 h-6 text-gray-700" />
        </button>
        
        <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-gray-800">Escanear Código</h3>
        </div>

        <div id={containerId} className="w-full h-64 bg-black"></div>

        {error && (
          <div className="p-4 text-center text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <div className="p-4 text-center text-gray-500 text-xs">
          Aponte a câmera para o código de barras
        </div>
      </div>
    </div>
  );
};