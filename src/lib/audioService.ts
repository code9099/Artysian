/**
 * Audio service for processing and managing audio files
 */

export interface AudioProcessingOptions {
  sampleRate?: number;
  channels?: number;
  bitRate?: number;
  format?: 'webm' | 'mp3' | 'wav';
}

export interface AudioAnalysis {
  duration: number;
  sampleRate: number;
  channels: number;
  waveformData: number[];
  averageVolume: number;
  peakVolume: number;
}

class AudioService {
  private audioContext: AudioContext | null = null;

  /**
   * Initialize audio context
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Convert audio blob to different format
   */
  async convertAudioFormat(
    audioBlob: Blob,
    options: AudioProcessingOptions = {}
  ): Promise<Blob> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = this.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const {
        sampleRate = 16000,
        channels = 1,
        format = 'webm'
      } = options;

      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(
        channels,
        audioBuffer.duration * sampleRate,
        sampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();

      const processedBuffer = await offlineContext.startRendering();
      
      // Convert to desired format
      return this.audioBufferToBlob(processedBuffer, format);
    } catch (error) {
      console.error('Error converting audio format:', error);
      throw new Error('Failed to convert audio format');
    }
  }

  /**
   * Analyze audio file and extract waveform data
   */
  async analyzeAudio(audioBlob: Blob): Promise<AudioAnalysis> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = this.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const channelData = audioBuffer.getChannelData(0);
      const samples = channelData.length;
      const duration = audioBuffer.duration;

      // Generate waveform data (downsample for visualization)
      const waveformPoints = 200;
      const samplesPerPoint = Math.floor(samples / waveformPoints);
      const waveformData: number[] = [];

      let totalVolume = 0;
      let peakVolume = 0;

      for (let i = 0; i < waveformPoints; i++) {
        const start = i * samplesPerPoint;
        const end = Math.min(start + samplesPerPoint, samples);
        
        let sum = 0;
        let peak = 0;
        
        for (let j = start; j < end; j++) {
          const amplitude = Math.abs(channelData[j]);
          sum += amplitude;
          peak = Math.max(peak, amplitude);
          totalVolume += amplitude;
          peakVolume = Math.max(peakVolume, amplitude);
        }
        
        const average = sum / (end - start);
        waveformData.push(average);
      }

      return {
        duration,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        waveformData,
        averageVolume: totalVolume / samples,
        peakVolume,
      };
    } catch (error) {
      console.error('Error analyzing audio:', error);
      throw new Error('Failed to analyze audio');
    }
  }

  /**
   * Compress audio file
   */
  async compressAudio(
    audioBlob: Blob,
    quality: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<Blob> {
    const qualitySettings = {
      low: { sampleRate: 8000, bitRate: 32000 },
      medium: { sampleRate: 16000, bitRate: 64000 },
      high: { sampleRate: 22050, bitRate: 128000 },
    };

    const settings = qualitySettings[quality];
    
    return this.convertAudioFormat(audioBlob, {
      sampleRate: settings.sampleRate,
      bitRate: settings.bitRate,
      channels: 1,
    });
  }

  /**
   * Trim audio file
   */
  async trimAudio(
    audioBlob: Blob,
    startTime: number,
    endTime: number
  ): Promise<Blob> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = this.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const sampleRate = audioBuffer.sampleRate;
      const startSample = Math.floor(startTime * sampleRate);
      const endSample = Math.floor(endTime * sampleRate);
      const trimmedLength = endSample - startSample;

      const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        sampleRate
      );

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const originalData = audioBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);
        
        for (let i = 0; i < trimmedLength; i++) {
          trimmedData[i] = originalData[startSample + i];
        }
      }

      return this.audioBufferToBlob(trimmedBuffer, 'webm');
    } catch (error) {
      console.error('Error trimming audio:', error);
      throw new Error('Failed to trim audio');
    }
  }

  /**
   * Apply noise reduction to audio
   */
  async reduceNoise(audioBlob: Blob): Promise<Blob> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = this.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;

      // Apply high-pass filter to reduce low-frequency noise
      const highPassFilter = offlineContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.value = 80; // Remove frequencies below 80Hz

      // Apply low-pass filter to reduce high-frequency noise
      const lowPassFilter = offlineContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.value = 8000; // Remove frequencies above 8kHz

      // Connect the audio processing chain
      source.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(offlineContext.destination);

      source.start();
      const processedBuffer = await offlineContext.startRendering();

      return this.audioBufferToBlob(processedBuffer, 'webm');
    } catch (error) {
      console.error('Error reducing noise:', error);
      throw new Error('Failed to reduce noise');
    }
  }

  /**
   * Normalize audio volume
   */
  async normalizeAudio(audioBlob: Blob, targetLevel: number = 0.8): Promise<Blob> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = this.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Find peak amplitude
      let peak = 0;
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < channelData.length; i++) {
          peak = Math.max(peak, Math.abs(channelData[i]));
        }
      }

      if (peak === 0) return audioBlob; // Avoid division by zero

      const gain = targetLevel / peak;

      // Create normalized buffer
      const normalizedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const originalData = audioBuffer.getChannelData(channel);
        const normalizedData = normalizedBuffer.getChannelData(channel);
        
        for (let i = 0; i < originalData.length; i++) {
          normalizedData[i] = originalData[i] * gain;
        }
      }

      return this.audioBufferToBlob(normalizedBuffer, 'webm');
    } catch (error) {
      console.error('Error normalizing audio:', error);
      throw new Error('Failed to normalize audio');
    }
  }

  /**
   * Convert AudioBuffer to Blob
   */
  private audioBufferToBlob(audioBuffer: AudioBuffer, format: string): Blob {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    
    // Create WAV file
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        const intSample = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Get audio duration from blob
   */
  async getAudioDuration(audioBlob: Blob): Promise<number> {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = this.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer.duration;
    } catch (error) {
      console.error('Error getting audio duration:', error);
      return 0;
    }
  }

  /**
   * Check if browser supports audio recording
   */
  isRecordingSupported(): boolean {
    return !!(
      typeof window !== 'undefined' && 
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices && 
      typeof navigator.mediaDevices.getUserMedia === 'function' && 
      window.MediaRecorder
    );
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats(): string[] {
    const formats = ['audio/webm', 'audio/mp4', 'audio/wav'];
    return formats.filter(format => MediaRecorder.isTypeSupported(format));
  }

  /**
   * Cleanup audio context
   */
  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const audioService = new AudioService();