import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Cloud, Link as LinkIcon, Upload, X } from 'lucide-react';

export interface ImageUploaderProps {
  value: string;
  onChange: (newImageUrl: string, sourceLabel?: string) => void;
  label?: string;
  compact?: boolean;
}

/**
 * Converts a Google Drive share URL into a direct embeddable image URL.
 */
export function normalizeGoogleDriveImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Match /file/d/{FILE_ID}/
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`;
  }

  // Match /d/{FILE_ID}/
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1] && trimmed.includes('drive.google.com')) {
    return `https://lh3.googleusercontent.com/d/${dMatch[1]}`;
  }

  // Match ?id={FILE_ID} or &id={FILE_ID}
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1] && trimmed.includes('google.com')) {
    return `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
  }

  return trimmed;
}

/**
 * Compresses an uploaded File or Blob onto an HTML5 Canvas so it stays well within
 * Firestore's document size limits (< 120KB) while remaining crisp on Retina screens.
 */
export async function compressImageFileToDataUrl(
  file: File | Blob,
  maxDimension = 880,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', quality);
        if (dataUrl && dataUrl.startsWith('data:image/')) {
          resolve(dataUrl);
        } else {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Product / Section Image',
  compact = false,
}) => {
  const [mode, setMode] = useState<'file' | 'camera' | 'gdrive' | 'link'>('file');
  const [driveInput, setDriveInput] = useState('');
  const [linkInput, setLinkInput] = useState(value || '');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setLinkInput(value || '');
  }, [value]);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const handleFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
    sourceLabel: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStatusMsg('Optimizing image for instant site-wide sync...');
      const compressedDataUrl = await compressImageFileToDataUrl(file);
      onChange(compressedDataUrl, sourceLabel);
      setStatusMsg(`${sourceLabel} ready & synced (${Math.round(compressedDataUrl.length / 1024)} KB)`);
    } catch {
      setStatusMsg('Could not process image file. Please try another photo.');
    } finally {
      e.target.value = '';
    }
  };

  const startLiveCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      // Fallback to native mobile camera file picker
      cameraFileInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch {
      setCameraError('Live webcam unavailable or permission declined — opening device camera picker instead.');
      cameraFileInputRef.current?.click();
    }
  };

  const captureLiveFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    const width = video.videoWidth || 800;
    const height = video.videoHeight || 600;
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 880 / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
      onChange(dataUrl, 'Camera Capture');
      setStatusMsg('Camera photo captured and applied.');
    }
    stopCameraStream();
  };

  const handleApplyGoogleDrive = () => {
    if (!driveInput.trim()) return;
    const converted = normalizeGoogleDriveImageUrl(driveInput);
    onChange(converted, 'Google Drive');
    setStatusMsg('Google Drive image link converted and applied.');
  };

  const handleApplyDirectLink = () => {
    if (!linkInput.trim()) return;
    onChange(linkInput.trim(), 'Direct Link');
    setStatusMsg('Image URL link applied.');
  };

  return (
    <div className="rounded-2xl border border-white/15 bg-[#05070D] p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#F4F6FB]">{label}</span>
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: 'file', label: 'File Upload', icon: Upload },
              { id: 'camera', label: 'Camera', icon: Camera },
              { id: 'gdrive', label: 'Google Drive', icon: Cloud },
              { id: 'link', label: 'Simple Link', icon: LinkIcon },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (mode === 'camera' && tab.id !== 'camera') {
                    stopCameraStream();
                  }
                  setMode(tab.id);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  mode === tab.id
                    ? 'bg-[#2563FF] text-white'
                    : 'bg-[#0A0E18] text-[#9AA3B8] hover:text-white border border-white/10'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelected(e, 'File Upload')}
        className="hidden"
      />
      <input
        ref={cameraFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelected(e, 'Camera Capture')}
        className="hidden"
      />

      {/* Mode Panels */}
      {mode === 'file' && (
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#38BDF8]/40 bg-[#0A0E18] px-3.5 py-2 text-xs font-semibold text-[#38BDF8] hover:bg-[#2563FF] hover:text-white transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Choose Image File from Device</span>
          </button>
          <span className="text-[11px] text-[#9AA3B8]">
            JPG, PNG, WebP or SVG — auto-optimized for fast loading
          </span>
        </div>
      )}

      {mode === 'camera' && (
        <div className="space-y-2.5">
          {!cameraActive ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={startLiveCamera}
                className="inline-flex items-center gap-2 rounded-xl border border-[#38BDF8]/40 bg-[#0A0E18] px-3.5 py-2 text-xs font-semibold text-[#38BDF8] hover:bg-[#2563FF] hover:text-white transition-colors cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Open Live Camera</span>
              </button>
              <button
                type="button"
                onClick={() => cameraFileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#0A0E18] px-3.5 py-2 text-xs font-semibold text-[#F4F6FB] hover:border-[#38BDF8] transition-colors cursor-pointer"
              >
                <span>Snap via Phone Camera App</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-[#38BDF8]/40 bg-[#0A0E18] p-3">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full max-h-48 rounded-lg bg-black object-contain"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={captureLiveFrame}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#2563FF] px-4 py-1.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Snap Photo Now</span>
                </button>
                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#9AA3B8] hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          )}
          {cameraError && (
            <p className="text-[11px] text-[#F5B93A]">{cameraError}</p>
          )}
        </div>
      )}

      {mode === 'gdrive' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={driveInput}
              onChange={(e) => setDriveInput(e.target.value)}
              placeholder="Paste Google Drive share link (https://drive.google.com/file/d/...)"
              aria-label="Google Drive image share link"
              className="flex-1 rounded-xl border border-white/15 bg-[#0A0E18] px-3 py-2 text-xs text-white focus:border-[#38BDF8] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyGoogleDrive}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563FF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] shrink-0 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply Drive Link</span>
            </button>
          </div>
          <p className="text-[11px] text-[#9AA3B8]">
            Set the Drive file to &ldquo;Anyone with the link can view&rdquo; and paste the link above.
          </p>
        </div>
      )}

      {mode === 'link' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://example.com/product.jpg or /assets/products/laptop-pro.svg"
              aria-label="Direct image URL link"
              className="flex-1 rounded-xl border border-white/15 bg-[#0A0E18] px-3 py-2 text-xs text-white focus:border-[#38BDF8] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyDirectLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563FF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] shrink-0 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Use Link</span>
            </button>
          </div>
        </div>
      )}

      {/* Current Preview & Quick Preset Selector */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-11 w-14 rounded-lg border border-white/15 bg-[#0A0E18] overflow-hidden shrink-0 flex items-center justify-center">
            {value ? (
              <img
                src={value}
                alt="Selected preview"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span className="text-[10px] text-[#9AA3B8]">None</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-[#F4F6FB] truncate">
              {statusMsg || (value?.startsWith('data:image/') ? 'Uploaded Custom Image Data' : value || 'Default studio graphic')}
            </p>
            {!compact && (
              <p className="text-[10px] text-[#9AA3B8]">
                Updates immediately across Homepage, Shop, and Product Detail pages
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
