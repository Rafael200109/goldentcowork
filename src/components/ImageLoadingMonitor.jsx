import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, Zap, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageLoadingMonitor = () => {
  const [metrics, setMetrics] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (!isDev) return;

    const handleUpdate = (e) => {
      setMetrics(e.detail);
    };

    window.addEventListener('img-metrics-update', handleUpdate);
    return () => window.removeEventListener('img-metrics-update', handleUpdate);
  }, [isDev]);

  if (!isDev || !metrics) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-12 right-0 mb-2 w-80 bg-slate-900 text-slate-50 p-4 rounded-xl shadow-2xl border border-slate-700 text-xs overflow-hidden"
          >
            <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
              <h3 className="font-bold flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Performance Monitor</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Images Loaded:</span>
                <span className="font-mono">{Object.keys(metrics.images).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bandwidth Est:</span>
                <span className="font-mono">{(metrics.totalBandwidth / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Slow Images (&gt;2s):</span>
                <span className={`font-mono px-2 py-0.5 rounded ${metrics.slowImages.length > 0 ? 'bg-red-900/50 text-red-400' : 'bg-emerald-900/50 text-emerald-400'}`}>
                  {metrics.slowImages.length}
                </span>
              </div>
            </div>

            {metrics.slowImages.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <p className="text-red-400 font-semibold mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Bottlenecks:
                </p>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {metrics.slowImages.slice(-5).map((img, i) => (
                    <div key={i} className="text-[10px] truncate text-slate-300" title={img.url}>
                      {Math.round(img.duration)}ms - {img.url.split('/').pop()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`p-3 rounded-full shadow-lg backdrop-blur-md border border-white/10 transition-colors ${
          metrics.slowImages.length > 0 
            ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' 
            : 'bg-slate-900/80 text-emerald-400 hover:bg-slate-800'
        }`}
      >
        <Zap className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ImageLoadingMonitor;