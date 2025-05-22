import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name (default: 'images')
 * @param folder - The folder path within the bucket (default: '')
 * @returns Object containing the file URL or error
 */
export const uploadFile = async (
  file: File,
  bucket: string = 'images',
  folder: string = ''
) => {
  try {
    // First, check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
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
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        name: error.name,
        stack: error.stack
      });

      // Provide a more helpful error message for bucket-related issues
      if (error.message?.includes('bucket') || error.statusCode === 404) {
        throw new Error(`Failed to upload to bucket "${bucket}". Please ensure the bucket exists and you have permission to upload.`);
      }

      throw error;
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading file:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      error: error // Log the original error object as well
    });
    return { 
      url: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred during file upload') 
    };
  }
}

/**
 * Deletes a file from Supabase Storage
 * @param filePath - The full path of the file to delete
 * @param bucket - The storage bucket name (default: 'images')
 * @returns Object containing success status or error
 */
export const deleteFile = async (
  filePath: string,
  bucket: string = 'images'
) => {
  try {
    // First, check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User is not authenticated. Please sign in to delete files.');
    }

    // Skip bucket existence check as it requires admin privileges
    // We'll attempt to delete directly and handle any errors

    // Extract the file path from the public URL if needed
    const path = filePath.includes(bucket) 
      ? filePath.split(`${bucket}/`)[1] 
      : filePath;

    console.log(`Attempting to delete file ${bucket}/${path} as user ${session.user.id}`);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Storage delete error:', {
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        name: error.name,
        stack: error.stack
      });

      // Provide a more helpful error message for bucket-related issues
      if (error.message?.includes('bucket') || error.statusCode === 404) {
        throw new Error(`Failed to delete from bucket "${bucket}". Please ensure the bucket exists and you have permission to delete.`);
      }

      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting file:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      error: error // Log the original error object as well
    });
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error occurred during file deletion') 
    };
  }
}
