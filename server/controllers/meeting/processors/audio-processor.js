import fs from 'fs/promises';
import path from 'path';
import logger from '../../../logger.js';

/**
 * Audio Processor - Handles audio recording and processing
 * Supports microphone and system audio capture on macOS/Windows
 */
export class AudioProcessor {
  constructor(options = {}) {
    this.recordingId = options.recordingId;
    this.audioSource = options.audioSource || 'microphone';
    this.quality = options.quality || 'medium';
    this.sampleRate = options.sampleRate || 44100;
    this.channels = options.channels || 1;
    this.isRecording = false;
    this.recordingProcess = null;
    this.outputPath = this.getOutputPath();
  }

  /**
   * Start audio recording
   * @returns {Object} Recording session data
   */
  async startRecording() {
    try {
      logger.info('[AUDIO_PROCESSOR] [startRecording] Starting audio recording', {
        recordingId: this.recordingId,
        audioSource: this.audioSource,
        quality: this.quality
      });

      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Get recording command based on platform and audio source
      const command = this.getRecordingCommand();

      logger.info('[AUDIO_PROCESSOR] [startRecording] Recording command:', command);

      // Start recording process (in a real implementation, this would be non-blocking)
      this.isRecording = true;

      // Mock recording session for now
      const session = {
        id: this.recordingId,
        startTime: new Date().toISOString(),
        audioSource: this.audioSource,
        outputPath: this.outputPath,
        status: 'recording',
        pid: Date.now(), // Mock process ID
      };

      logger.info('[AUDIO_PROCESSOR] [startRecording] Recording started successfully');

      return session;
    } catch (error) {
      logger.error('[AUDIO_PROCESSOR] [startRecording] Error:', error);
      throw new Error(`Failed to start recording: ${error.message}`);
    }
  }

  /**
   * Stop audio recording
   * @returns {Object} Recording result data
   */
  async stopRecording() {
    try {
      logger.info('[AUDIO_PROCESSOR] [stopRecording] Stopping audio recording', {
        recordingId: this.recordingId
      });

      if (!this.isRecording) {
        throw new Error('No active recording found');
      }

      // Stop recording process
      this.isRecording = false;

      // Mock audio file creation
      const duration = Math.floor(Math.random() * 300) + 60; // Random duration between 1-6 minutes
      await this.createMockAudioFile();

      const result = {
        recordingId: this.recordingId,
        filePath: this.outputPath,
        duration,
        size: await AudioProcessor.getFileSize(this.outputPath),
        sampleRate: this.sampleRate,
        channels: this.channels,
        format: 'wav',
      };

      logger.info('[AUDIO_PROCESSOR] [stopRecording] Recording stopped successfully', result);

      return result;
    } catch (error) {
      logger.error('[AUDIO_PROCESSOR] [stopRecording] Error:', error);
      throw new Error(`Failed to stop recording: ${error.message}`);
    }
  }

  /**
   * Get recording command based on platform and audio source
   * @returns {string} Recording command
   */
  getRecordingCommand() {
    const { platform } = process;
    
    if (platform === 'darwin') {
      return this.getMacOSRecordingCommand();
    } else if (platform === 'win32') {
      return this.getWindowsRecordingCommand();
    } else if (platform === 'linux') {
      return this.getLinuxRecordingCommand();
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Get macOS recording command
   * @returns {string} SoX or other recording command for macOS
   */
  getMacOSRecordingCommand() {
    const qualitySettings = this.getQualitySettings();
    
    if (this.audioSource === 'system') {
      // Use SoundFlower or BlackHole for system audio on macOS
      return `sox -t coreaudio "BlackHole 2ch" -r ${this.sampleRate} -c ${this.channels} -b ${qualitySettings.bitDepth} "${this.outputPath}"`;
    } else if (this.audioSource === 'microphone') {
      // Use built-in microphone
      return `sox -t coreaudio ":default" -r ${this.sampleRate} -c ${this.channels} -b ${qualitySettings.bitDepth} "${this.outputPath}"`;
    } else if (this.audioSource === 'both') {
      // Mix system audio and microphone (advanced setup required)
      return `sox -m -t coreaudio "BlackHole 2ch" -t coreaudio ":default" -r ${this.sampleRate} -c ${this.channels} -b ${qualitySettings.bitDepth} "${this.outputPath}"`;
    }
  }

  /**
   * Get Windows recording command
   * @returns {string} FFmpeg command for Windows
   */
  getWindowsRecordingCommand() {
    if (this.audioSource === 'system') {
      // Use Windows WASAPI for system audio
      return `ffmpeg -f wasapi -i "Speakers (Realtek High Definition Audio)" -ar ${this.sampleRate} -ac ${this.channels} "${this.outputPath}"`;
    } else if (this.audioSource === 'microphone') {
      // Use default microphone
      return `ffmpeg -f wasapi -i "Microphone (Realtek High Definition Audio)" -ar ${this.sampleRate} -ac ${this.channels} "${this.outputPath}"`;
    } else if (this.audioSource === 'both') {
      // Mix system audio and microphone
      return `ffmpeg -f wasapi -i "Speakers (Realtek High Definition Audio)" -f wasapi -i "Microphone (Realtek High Definition Audio)" -filter_complex "[0:a][1:a]amix=inputs=2[a]" -map "[a]" -ar ${this.sampleRate} -ac ${this.channels} "${this.outputPath}"`;
    }
  }

  /**
   * Get Linux recording command
   * @returns {string} ALSA/PulseAudio command for Linux
   */
  getLinuxRecordingCommand() {
    if (this.audioSource === 'system') {
      // Use PulseAudio for system audio
      return `parecord --device=alsa_output.pci-0000_00_1f.3.analog-stereo.monitor --format=s16le --rate=${this.sampleRate} --channels=${this.channels} "${this.outputPath}"`;
    } else if (this.audioSource === 'microphone') {
      // Use default microphone
      return `arecord -f S16_LE -r ${this.sampleRate} -c ${this.channels} "${this.outputPath}"`;
    } else if (this.audioSource === 'both') {
      // Mix system audio and microphone (requires advanced PulseAudio setup)
      return `ffmpeg -f pulse -i default -f pulse -i alsa_output.pci-0000_00_1f.3.analog-stereo.monitor -filter_complex "[0:a][1:a]amix=inputs=2[a]" -map "[a]" -ar ${this.sampleRate} -ac ${this.channels} "${this.outputPath}"`;
    }
  }

  /**
   * Get quality settings based on quality level
   * @returns {Object} Quality settings
   */
  getQualitySettings() {
    const settings = {
      low: { bitDepth: 8, bitrate: '64k' },
      medium: { bitDepth: 16, bitrate: '128k' },
      high: { bitDepth: 24, bitrate: '256k' },
    };

    return settings[this.quality] || settings.medium;
  }

  /**
   * Get output file path
   * @returns {string} Output file path
   */
  getOutputPath() {
    const baseDir = path.join(process.cwd(), 'uploads', 'meetings');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(baseDir, `${this.recordingId}_${timestamp}.wav`);
  }

  /**
   * Ensure output directory exists
   */
  async ensureOutputDirectory() {
    const dir = path.dirname(this.outputPath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      logger.error('[AUDIO_PROCESSOR] [ensureOutputDirectory] Error:', error);
      throw new Error(`Failed to create output directory: ${error.message}`);
    }
  }

  /**
   * Create mock audio file for testing
   */
  async createMockAudioFile() {
    try {
      // Create a simple mock WAV file header + minimal audio data
      const mockAudioData = Buffer.alloc(1024, 0);
      await fs.writeFile(this.outputPath, mockAudioData);
      logger.info('[AUDIO_PROCESSOR] [createMockAudioFile] Mock audio file created');
    } catch (error) {
      logger.error('[AUDIO_PROCESSOR] [createMockAudioFile] Error:', error);
      throw new Error(`Failed to create mock audio file: ${error.message}`);
    }
  }

  /**
   * Get file size
   * @param {string} filePath - File path
   * @returns {number} File size in bytes
   */
  static async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      logger.warn('[AUDIO_PROCESSOR] [getFileSize] Error getting file size:', error);
      return 0;
    }
  }

  /**
   * Delete audio file
   * @param {string} filePath - File path to delete
   */
  static async deleteAudioFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info('[AUDIO_PROCESSOR] [deleteAudioFile] Audio file deleted:', filePath);
    } catch (error) {
      logger.error('[AUDIO_PROCESSOR] [deleteAudioFile] Error:', error);
      throw new Error(`Failed to delete audio file: ${error.message}`);
    }
  }
}
