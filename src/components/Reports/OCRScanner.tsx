import React, { useState } from 'react';
import { Scan, Camera, AlertCircle } from 'lucide-react';
import { extractFieldReportFromImage, ExtractedReportData } from '../../lib/gemini';

interface Props {
  onExtracted: (data: ExtractedReportData) => void;
}

export default function OCRScanner({ onExtracted }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const data = await extractFieldReportFromImage(base64);

        if (data.communityName || data.description || data.needCategory) {
          onExtracted(data);
        } else {
          setError('Could not extract clear data from the image. Try a clearer photo.');
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error processing image.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-8 shadow-sm text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <Scan className="text-primary w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold mb-2">Smart OCR Scanner</h2>
      <p className="text-sm text-slate mb-6">
        Take a photo of a paper survey to auto-extract data using Gemini AI Vision.
      </p>

      <label className="block cursor-pointer">
        <div className={`w-full py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
          loading ? 'bg-slate-50 border-slate-200' : 'border-primary/30 hover:border-primary hover:bg-primary/5'
        }`}>
          {loading ? (
            <>
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-sm font-bold text-primary">AI is reading the paper...</span>
            </>
          ) : (
            <>
              <Camera className="w-10 h-10 text-primary" />
              <span className="text-sm font-bold text-primary">Capture or Upload Survey</span>
              <span className="text-xs text-slate">Supports handwritten and printed surveys</span>
            </>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
          disabled={loading}
        />
      </label>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-danger text-sm rounded-lg flex items-center gap-2 justify-center">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}
    </div>
  );
}
