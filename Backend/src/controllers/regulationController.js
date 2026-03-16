import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';

// Initialize Supabase client
let supabaseClient = null;
if (config.supabase.url && config.supabase.serviceRoleKey) {
  supabaseClient = createClient(config.supabase.url, config.supabase.serviceRoleKey);
}

/**
 * Upload image to Supabase Storage
 */
async function uploadImageToSupabase(fileBuffer, fileName, contentType) {
  if (!supabaseClient) {
    throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  const fileExt = fileName.split('.').pop();
  const filePath = `regulation-updates/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error } = await supabaseClient.storage
    .from(config.supabase.storageBucket)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabaseClient.storage
    .from(config.supabase.storageBucket)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Regulation Update Controller
 */
export const regulationController = {
  /**
   * Get all regulation updates (sorted by publishedAt descending)
   */
  getAll: async () => {
    try {
      const updates = await prisma.regulationUpdate.findMany({
        orderBy: { publishedAt: 'desc' },
      });

      return new Response(
        JSON.stringify({ updates }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error fetching regulation updates:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch regulation updates' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },

  /**
   * Get regulation update by ID
   */
  getById: async (request) => {
    try {
      const url = new URL(request.url);
      const id = parseInt(url.pathname.split('/').pop(), 10);

      if (isNaN(id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid ID' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const update = await prisma.regulationUpdate.findUnique({
        where: { id },
      });

      if (!update) {
        return new Response(
          JSON.stringify({ error: 'Regulation update not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ update }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error fetching regulation update:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch regulation update' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },

  /**
   * Create new regulation update
   */
  create: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Only ADMIN_PUSAT can create regulation updates
      if (user.userRole !== 'RISK_ASSESSMENT') {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Only ADMIN_PUSAT can create regulation updates' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const body = await request.json();
      const { title, category, contentType, content, link } = body;

      // Validate required fields
      if (!title || !category || !contentType || !content) {
        return new Response(
          JSON.stringify({ error: 'Title, category, contentType, and content are required' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      let finalContent = content;
      let contentTypeEnum = contentType.toUpperCase();

      // If content type is IMAGE and content is base64, upload to Supabase
      if (contentTypeEnum === 'IMAGE' && content.startsWith('data:image/')) {
        try {
          // Extract file info from base64
          const matches = content.match(/^data:image\/(\w+);base64,(.+)$/);
          if (matches) {
            const fileExtension = matches[1];
            const base64Data = matches[2];
            // Convert base64 to Uint8Array for Bun
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const fileName = `regulation-${Date.now()}.${fileExtension}`;
            const mimeType = `image/${fileExtension}`;

            // Upload to Supabase Storage
            finalContent = await uploadImageToSupabase(bytes, fileName, mimeType);
          } else {
            return new Response(
              JSON.stringify({ error: 'Invalid image format' }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          return new Response(
            JSON.stringify({ error: `Failed to upload image: ${uploadError.message}` }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      // Create regulation update
      const update = await prisma.regulationUpdate.create({
        data: {
          title,
          category,
          contentType: contentTypeEnum,
          content: finalContent,
          link: link && link.trim() ? link.trim() : null,
        },
      });

      return new Response(
        JSON.stringify({ update }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error creating regulation update:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create regulation update' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },

  /**
   * Update regulation update
   */
  update: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Only ADMIN_PUSAT can update regulation updates
      if (user.userRole !== 'RISK_ASSESSMENT') {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Only ADMIN_PUSAT can update regulation updates' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const url = new URL(request.url);
      const id = parseInt(url.pathname.split('/').pop(), 10);

      if (isNaN(id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid ID' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const body = await request.json();
      const { title, category, contentType, content, link } = body;

      // Check if update exists
      const existing = await prisma.regulationUpdate.findUnique({
        where: { id },
      });

      if (!existing) {
        return new Response(
          JSON.stringify({ error: 'Regulation update not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      let finalContent = content;
      let contentTypeEnum = contentType ? contentType.toUpperCase() : existing.contentType;

      // If content type is IMAGE and content is base64, upload to Supabase
      if (contentTypeEnum === 'IMAGE' && content && content.startsWith('data:image/')) {
        try {
          const matches = content.match(/^data:image\/(\w+);base64,(.+)$/);
          if (matches) {
            const fileExtension = matches[1];
            const base64Data = matches[2];
            // Convert base64 to Uint8Array for Bun
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const fileName = `regulation-${Date.now()}.${fileExtension}`;
            const mimeType = `image/${fileExtension}`;

            finalContent = await uploadImageToSupabase(bytes, fileName, mimeType);
          }
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          return new Response(
            JSON.stringify({ error: `Failed to upload image: ${uploadError.message}` }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      // Update regulation update
      const update = await prisma.regulationUpdate.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(category && { category }),
          ...(contentType && { contentType: contentTypeEnum }),
          ...(content && { content: finalContent }),
          ...(link !== undefined && { link: link && link.trim() ? link.trim() : null }),
        },
      });

      return new Response(
        JSON.stringify({ update }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error updating regulation update:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update regulation update' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },

  /**
   * Delete regulation update
   */
  delete: async (request) => {
    try {
      const user = request.user;
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Not authenticated' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Only ADMIN_PUSAT can delete regulation updates
      if (user.userRole !== 'RISK_ASSESSMENT') {
        return new Response(
          JSON.stringify({ error: 'Unauthorized. Only ADMIN_PUSAT can delete regulation updates' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const url = new URL(request.url);
      const id = parseInt(url.pathname.split('/').pop(), 10);

      if (isNaN(id)) {
        return new Response(
          JSON.stringify({ error: 'Invalid ID' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if update exists
      const existing = await prisma.regulationUpdate.findUnique({
        where: { id },
      });

      if (!existing) {
        return new Response(
          JSON.stringify({ error: 'Regulation update not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // If it's an image, delete from Supabase Storage
      if (existing.contentType === 'IMAGE' && existing.content) {
        try {
          // Extract file path from URL
          const urlParts = existing.content.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `regulation-updates/${fileName}`;

          if (supabaseClient) {
            await supabaseClient.storage
              .from(config.supabase.storageBucket)
              .remove([filePath]);
          }
        } catch (deleteError) {
          console.error('Error deleting image from Supabase:', deleteError);
          // Continue with database deletion even if image deletion fails
        }
      }

      // Delete from database
      await prisma.regulationUpdate.delete({
        where: { id },
      });

      return new Response(
        JSON.stringify({ message: 'Regulation update deleted successfully' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error deleting regulation update:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete regulation update' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
