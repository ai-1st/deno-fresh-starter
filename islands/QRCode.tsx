import { useEffect, useRef } from "preact/hooks";
import QRCode from "npm:qrcode";

interface QRCodeProps {
  value: string;
  width?: number;
  height?: number;
}

export default function QRCodeComponent({ value, width = 200, height = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, value, {
      width,
      height,
      margin: 1,
      errorCorrectionLevel: 'M',
    }, (error) => {
      if (error) console.error('Error generating QR code:', error);
    });
  }, [value, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      class="bg-white rounded-lg shadow-sm"
    />
  );
}
