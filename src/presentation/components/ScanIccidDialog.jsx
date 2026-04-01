import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';

const normalizeIccid = (value) => String(value || '').replace(/\s+/g, '').trim();
const extractIccid = (value) => {
  const normalized = normalizeIccid(value);
  if (/^[0-9]{18,22}$/.test(normalized)) {
    return normalized;
  }

  const match = normalized.match(/\d{18,22}/);
  return match ? match[0] : '';
};

export function ScanIccidDialog({ isOpen, onClose, onScan }) {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleOpenChange = (open) => {
    if (!open && typeof onClose === 'function') {
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let active = true;
    let controls = null;
    const reader = new BrowserMultiFormatReader();

    const drawOverlay = (points) => {
      const canvas = overlayRef.current;
      const video = videoRef.current;
      if (!canvas || !video) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const { clientWidth, clientHeight, videoWidth, videoHeight } = video;
      if (!clientWidth || !clientHeight || !videoWidth || !videoHeight) {
        return;
      }

      canvas.width = clientWidth;
      canvas.height = clientHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const safePoints = (points || []).filter(Boolean);
      if (!safePoints.length) {
        return;
      }

      const scaleX = clientWidth / videoWidth;
      const scaleY = clientHeight / videoHeight;
      const mapped = safePoints.map((point) => ({
        x: point.x * scaleX,
        y: point.y * scaleY,
      }));

      const xs = mapped.map((point) => point.x);
      const ys = mapped.map((point) => point.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      ctx.strokeStyle = '#3ebb7f';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(62, 187, 127, 0.15)';

      ctx.beginPath();
      ctx.moveTo(mapped[0].x, mapped[0].y);
      mapped.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.closePath();
      ctx.stroke();

      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    };

    const startScanning = async () => {
      try {
        if (!videoRef.current) {
          return;
        }

        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (!result || !active) {
            return;
          }

          const points = typeof result.getResultPoints === 'function' ? result.getResultPoints() : [];
          drawOverlay(points);

          const rawValue = typeof result.getText === 'function' ? result.getText() : String(result);
          const extracted = extractIccid(rawValue);

          if (!extracted) {
            setError('Scanned value does not include a valid ICCID.');
            return;
          }

          if (typeof onScan === 'function') {
            onScan(extracted);
          }
          if (typeof onClose === 'function') {
            onClose();
          }
        });

        if (active) {
          setStatus('Align the barcode inside the frame and tilt to reduce glare.');
        }
      } catch {
        if (!active) {
          return;
        }

        setError('Unable to access camera. Allow permission or use HTTPS/localhost.');
        setStatus('');
      }
    };

    const timer = setTimeout(() => {
      if (active) {
        setError('');
        setStatus('Starting camera...');
      }
      startScanning();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
      try {
        if (controls) {
          controls.stop();
        }
        reader.reset();
      } catch {
        // Ignore camera cleanup errors on unmount.
        
      }
    };
  }, [isOpen, onClose, onScan]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan ICCID</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-[#f3f3f3] bg-[#f9f9f9] p-3 text-sm text-[#828282]">
            <p>Hold the barcode steady in the frame. Good lighting helps.</p>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-[#e5e5e5] bg-black">
            <video ref={videoRef} className="h-64 w-full object-cover -scale-x-100" muted playsInline />
            <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
          </div>
          {status && <p className="text-sm text-[#828282]">{status}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
