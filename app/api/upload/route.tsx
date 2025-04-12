import { NextResponse } from 'next/server';

const PUBLISHER_URL = process.env.NEXT_PUBLIC_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';

export async function POST(request: Request) {
  try {
    const blob = await request.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // upload to walrus
    const response = await fetch(`${PUBLISHER_URL}/v1/blobs?epochs=183`, {
      method: 'PUT',
      body: buffer,
      headers: {
        'Content-Type': blob.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({ message: 'Upload successful', data: result });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ message: 'Error processing upload' }, { status: 500 });
  }
}