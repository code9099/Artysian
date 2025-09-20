'use client';

import { useEffect, useRef, useState } from 'react';

interface WaveformProps {
  audioData?: number[];
  isRecording?: boolean;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  className?: string;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export function Waveform({
  audioData = [],
  isRecording = false,
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  onSeek,
  className = '',
  height = 60,
  color = '#C9A227', // Gold color
  backgroundColor = '#FFF4E6', // Beige color
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [realtimeData, setRealtimeData] = useState<number[]>([]);

  // Generate random waveform data for recording visualization
  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRealtimeData(prev => {
          const newData = [...prev];
          // Add new random amplitude
          newData.push(Math.random() * 0.8 + 0.1);
          // Keep only last 100 points
          if (newData.length > 100) {
            newData.shift();
          }
          return newData;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setRealtimeData([]);
    }
  }, [isRecording]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    drawWaveform(ctx, rect.width, rect.height);
  }, [audioData, realtimeData, isRecording, isPlaying, currentTime, duration, color, backgroundColor]);

  const drawWaveform = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    const data = isRecording ? realtimeData : audioData;
    if (data.length === 0) return;

    const barWidth = width / data.length;
    const centerY = height / 2;

    data.forEach((amplitude, index) => {
      const x = index * barWidth;
      const barHeight = amplitude * (height * 0.8);
      
      // Determine color based on playback position
      let barColor = color;
      if (!isRecording && duration > 0) {
        const progress = currentTime / duration;
        const barProgress = index / data.length;
        
        if (barProgress <= progress) {
          barColor = '#FFD369'; // Gold-light for played portion
        } else {
          barColor = color; // Regular gold for unplayed portion
        }
      }

      // Draw bar
      ctx.fillStyle = barColor;
      ctx.fillRect(
        x,
        centerY - barHeight / 2,
        Math.max(barWidth - 1, 1),
        barHeight
      );

      // Add glow effect for recording
      if (isRecording && index >= data.length - 5) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillRect(
          x,
          centerY - barHeight / 2,
          Math.max(barWidth - 1, 1),
          barHeight
        );
        ctx.shadowBlur = 0;
      }
    });

    // Draw progress indicator
    if (!isRecording && duration > 0 && isPlaying) {
      const progress = currentTime / duration;
      const progressX = progress * width;
      
      ctx.strokeStyle = '#8B4513'; // Charcoal color
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || isRecording || duration === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const progress = x / rect.width;
    const seekTime = progress * duration;
    
    onSeek(seekTime);
  };

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className={`w-full ${onSeek && !isRecording ? 'cursor-pointer' : ''}`}
        style={{ height: `${height}px` }}
        onClick={handleCanvasClick}
      />
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-xs text-charcoal font-medium">REC</span>
        </div>
      )}
      
      {/* Time indicators */}
      {!isRecording && duration > 0 && (
        <div className="flex justify-between text-xs text-brown mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Simplified waveform for small spaces
export function MiniWaveform({
  isRecording = false,
  audioLevel = 0,
  className = '',
}: {
  isRecording?: boolean;
  audioLevel?: number;
  className?: string;
}) {
  const bars = Array.from({ length: 5 }, (_, i) => {
    const baseHeight = 20 + (i % 2) * 10;
    const animatedHeight = isRecording ? baseHeight + (audioLevel * 30) : baseHeight;
    return animatedHeight;
  });

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={`w-1 bg-gold rounded-full transition-all duration-150 ${
            isRecording ? 'animate-pulse' : ''
          }`}
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  );
}