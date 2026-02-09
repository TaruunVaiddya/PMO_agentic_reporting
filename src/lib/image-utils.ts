/**
 * Utility functions for image processing
 */

export interface ChatImage {
  data: string;        // base64-encoded image data (no data URI prefix)
  mime_type: string;   // "image/png" | "image/jpeg" | "image/webp" | "image/gif"
  filename?: string;   // optional original filename
}

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

export type AllowedImageMimeType = typeof ALLOWED_IMAGE_MIME_TYPES[number];

export const MAX_IMAGES_PER_REQUEST = 4;

/**
 * Check if a MIME type is allowed for image upload
 */
export function isAllowedImageMimeType(mimeType: string): mimeType is AllowedImageMimeType {
  return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as AllowedImageMimeType);
}

/**
 * Convert a blob/file URL to base64 string (without data URI prefix)
 */
export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data URI prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert FileUIPart objects to ChatImage format for API
 */
export async function convertFilesToChatImages(
  files: Array<{ url: string; mediaType?: string; filename?: string }>
): Promise<ChatImage[]> {
  const validFiles = files.filter(
    (file) => file.mediaType && isAllowedImageMimeType(file.mediaType)
  );

  // Limit to max allowed images
  const limitedFiles = validFiles.slice(0, MAX_IMAGES_PER_REQUEST);

  const chatImages = await Promise.all(
    limitedFiles.map(async (file) => {
      const base64Data = await urlToBase64(file.url);
      return {
        data: base64Data,
        mime_type: file.mediaType as AllowedImageMimeType,
        filename: file.filename,
      };
    })
  );

  return chatImages;
}
