import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

export interface ConvertResult {
  filePath: string;
  fileName: string;
}

/**
 * Converts a .mov file to .mp4 if necessary.
 */
export async function convertMovToMp4(filePath: string, fileName: string): Promise<ConvertResult> {
  if (!fileName.toLowerCase().endsWith('.mov')) {
    return { filePath, fileName };
  }

  const convertedFilePath = `${filePath}.mp4`;
  await new Promise<void>((resolve, reject) => {
    ffmpeg(filePath).output(convertedFilePath).on('end', () => resolve()).on('error', reject).run();
  });

  fs.unlinkSync(filePath); // Remove the original .mov file
  return {
    filePath: convertedFilePath,
    fileName: fileName.replace(/\.mov$/i, '.mp4'),
  };
}
