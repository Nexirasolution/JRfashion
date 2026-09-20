import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');
  const folder = formData.get('folder') || 'uploads';

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Build a unique key, preserving folder structure + original extension
  const ext = file.name?.includes('.') ? file.name.split('.').pop() : '';
  const key = `${folder}/${randomUUID()}${ext ? '.' + ext : ''}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    })
  );

  const url = `${process.env.R2_PUBLIC_URL}/${key}`;

  return NextResponse.json({ url });
}