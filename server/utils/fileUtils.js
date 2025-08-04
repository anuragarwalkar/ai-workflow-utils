import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

/**
 * Converts a .mov file to .mp4 if necessary.
 * @param {string} filePath - The path to the file.
 * @param {string} fileName - The name of the file.
 * @returns {Promise<{filePath: string, fileName: string}>} - The updated file path and name.
 */
export async function convertMovToMp4(filePath, fileName) {
  if (!fileName.toLowerCase().endsWith('.mov')) {
    // Return the original file path and name for non-.mov files
    return { filePath, fileName };
  }

  const convertedFilePath = `${filePath}.mp4`;
  await new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .output(convertedFilePath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  fs.unlinkSync(filePath); // Remove the original .mov file
  return {
    filePath: convertedFilePath,
    fileName: fileName.replace(/\.mov$/i, '.mp4'),
  };
}
