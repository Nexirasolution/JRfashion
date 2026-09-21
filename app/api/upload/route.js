import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs'; // the Cloudinary SDK needs Node APIs

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');
  const folder = formData.get('folder') || 'uploads';

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Unique public_id. Images/videos get their extension from the delivery URL,
  // but raw files (pdf, zip, etc.) need the extension baked into the public_id.
  const ext = file.name?.includes('.') ? file.name.split('.').pop() : '';
  const isMedia = file.type?.startsWith('image/') || file.type?.startsWith('video/');
  const publicId = isMedia || !ext ? randomUUID() : `${randomUUID()}.${ext}`;

  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: 'auto',
          },
          (error, res) => (error ? reject(error) : resolve(res))
        )
        .end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}