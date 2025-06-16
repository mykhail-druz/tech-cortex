import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name (default: 'images')
 * @param folder - The folder path within the bucket (default: '')
 * @returns Object containing the file URL or error
 */
export const uploadFile = async (file: File, bucket: string = 'images', folder: string = '') => {
  try {
    // First, check if the user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User is not authenticated. Please sign in to upload files.');
    }

    // Generate a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;

    // Create the full path including folder if provided
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Skip bucket existence check as it requires admin privileges
    // We'll attempt to upload directly and handle any errors

    console.log(`Attempting to upload file to ${bucket}/${filePath} as user ${session.user.id}`);

    // Upload the file to Supabase Storage
    // Make sure the file is uploaded to the public bucket
    console.log(`Uploading file to public bucket: ${bucket}/${filePath}`);
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      // Set public access for the file
      public: true,
    });

    if (error) {
      console.error('Storage upload error:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        name: error.name,
        stack: error.stack,
      });

      // Provide a more helpful error message for bucket-related issues
      if (error.message?.includes('bucket') || error.statusCode === 404) {
        throw new Error(
          `Failed to upload to bucket "${bucket}". Please ensure the bucket exists and you have permission to upload.`
        );
      }

      throw error;
    }

    // Get the public URL for the uploaded file
    console.log(`Getting public URL for ${bucket}/${filePath}`);

    // SIMPLIFIED APPROACH: Always return a URL, even if it's a fallback

    // 1. Try the standard method first (this should work in most cases)
    const publicUrlResponse = supabase.storage.from(bucket).getPublicUrl(filePath);
    console.log('Public URL response:', JSON.stringify(publicUrlResponse, null, 2));

    if (publicUrlResponse.data && publicUrlResponse.data.publicUrl) {
      const publicUrl = publicUrlResponse.data.publicUrl;
      console.log('Successfully got public URL using standard method:', publicUrl);
      return { url: publicUrl, error: null };
    }

    console.log('Standard method did not return a valid URL, trying alternative approaches...');

    // Always use the specific Supabase URL format required
    const supabaseUrl = 'https://qaugzgfnfndwilolhjdi.supabase.co';
    console.log('Using required Supabase URL format:', supabaseUrl);

    // 3. Construct a URL using the Supabase URL and file path
    const constructedUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
    console.log('Constructed URL using Supabase URL and file path:', constructedUrl);

    // 4. Always return a URL, even if it's just a relative one
    return { url: constructedUrl, error: null, fileName };
  } catch (error) {
    console.error('Error uploading file:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      error: error, // Log the original error object as well
    });
    return {
      url: null,
      error:
        error instanceof Error ? error : new Error('Unknown error occurred during file upload'),
      fileName: null,
    };
  }
};

/**
 * Deletes a file from Supabase Storage
 * @param filePath - The full path of the file to delete
 * @param bucket - The storage bucket name (default: 'images')
 * @returns Object containing success status or error
 */
export const deleteFile = async (filePath: string, bucket: string = 'images') => {
  try {
    // First, check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User is not authenticated. Please sign in to delete files.');
    }

    // Skip bucket existence check as it requires admin privileges
    // We'll attempt to delete directly and handle any errors

    // Extract the file path from the public URL if needed
    let path = filePath;

    // Handle full Supabase URLs with /public/ (https://xxx.supabase.co/storage/v1/object/public/bucket/path)
    if (filePath.includes('/storage/v1/object/public/')) {
      const publicPathRegex = /\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/;
      const match = filePath.match(publicPathRegex);
      if (match && match.length >= 3) {
        // match[1] is the bucket name, match[2] is the file path
        path = match[2];
      }
    }
    // Handle full Supabase URLs without /public/ (https://xxx.supabase.co/storage/v1/object/bucket/path)
    else if (filePath.includes('/storage/v1/object/')) {
      const directPathRegex = /\/storage\/v1\/object\/([^\/]+)\/(.+)/;
      const match = filePath.match(directPathRegex);
      if (match && match.length >= 3) {
        // match[1] is the bucket name, match[2] is the file path
        path = match[2];
      }
    }
    // Handle CDN URLs (https://xxx.supabase.co/storage/v1/object/sign/bucket/path)
    else if (filePath.includes('/storage/v1/object/sign/')) {
      const signedPathRegex = /\/storage\/v1\/object\/sign\/([^\/]+)\/(.+)/;
      const match = filePath.match(signedPathRegex);
      if (match && match.length >= 3) {
        // match[1] is the bucket name, match[2] is the file path
        path = match[2];
      }
    }
    // Handle simpler URLs that just include the bucket name
    else if (filePath.includes(`${bucket}/`)) {
      path = filePath.split(`${bucket}/`)[1];
    }

    // Ensure the path includes the 'images' folder if it's in the products bucket
    // This is needed because images are uploaded to 'products/images' but the URL might not reflect this structure
    if (bucket === 'products' && !path.startsWith('images/') && !path.includes('/images/')) {
      path = `images/${path}`;
      console.log(`Added 'images/' prefix to path: ${path}`);
    }

    // Remove any query parameters from the path
    if (path.includes('?')) {
      path = path.split('?')[0];
    }

    // Decode URL-encoded characters in the path
    try {
      path = decodeURIComponent(path);
    } catch (e) {
      console.warn('Failed to decode URL path, using as-is:', e);
    }

    console.log(`Original URL: ${filePath}`);
    console.log(`Extracted path: ${path}`);

    // Ensure we have a valid path before attempting to delete
    if (!path || path.trim() === '') {
      console.error('Invalid file path extracted from URL:', filePath);
      return { success: false, error: new Error('Invalid file path extracted from URL') };
    }

    console.log(`Attempting to delete file ${bucket}/${path} as user ${session.user.id}`);

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Storage delete error:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        name: error.name,
        stack: error.stack,
      });

      // Provide a more helpful error message for bucket-related issues
      if (error.message?.includes('bucket') || error.statusCode === 404) {
        throw new Error(
          `Failed to delete from bucket "${bucket}". Please ensure the bucket exists and you have permission to delete.`
        );
      }

      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting file:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      error: error, // Log the original error object as well
    });
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error('Unknown error occurred during file deletion'),
    };
  }
};
