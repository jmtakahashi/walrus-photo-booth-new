'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Camera, Check, Loader2 } from 'lucide-react';
import JSConfetti from 'js-confetti';
import { createClient } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import QRCode from 'react-qr-code';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Props {
  selectedEventId: number;
  selectedEventTitle: string;
  selectedEventSlug: string;
}

const PhotoBooth: React.FC<Props> = ({
  selectedEventTitle,
  selectedEventSlug,
  selectedEventId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const jsConfettiRef = useRef<JSConfetti | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_BASE_URL || '';
  const eventUrl = `${baseUrl}/events/${selectedEventSlug}`;

  useEffect(() => {
    jsConfettiRef.current = new JSConfetti();
    return () => {
      jsConfettiRef.current = null;
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showModal) {
      timer = setTimeout(() => {
        setShowModal(false);
      }, 45000); // 45 seconds
    }
    return () => clearTimeout(timer);
  }, [showModal]);

  const startCamera = async () => {
    if (videoRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
    }
  };

  const takePhotoSequence = async () => {
    setIsCapturing(true);
    setShowModal(false);
    setIsUploaded(false);
    setIsUploading(false);

    const newPhotos: string[] = [];

    // take four photos
    for (let i = 0; i < 4; ++i) {
      // count down for each photo
      for (let count = 3; count >= 0; --count) {
        setCountdown(count);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const videoElement = videoRef.current;

        if (context) {
          const { videoWidth, videoHeight } = videoElement;

          canvas.width = videoWidth;
          canvas.height = videoHeight;

          context.drawImage(videoElement, 0, 0, videoWidth, videoHeight);
          const photoData = canvas.toDataURL('image/png');
          newPhotos.push(photoData);
        }
      }

      if (i < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // generate final photo strip
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context && newPhotos.length === 4) {
        const { videoWidth, videoHeight } = videoRef.current!;
        const singleWidth = videoWidth;
        const singleHeight = videoHeight;
        const padding = 20;
        const borderWidth = 40;

        canvas.width = singleWidth + borderWidth * 2;
        canvas.height = singleHeight * 4 + padding * 3 + borderWidth * 2;

        // fill with white background
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // load and draw images
        const images = await Promise.all(
          newPhotos.map(
            (photo) =>
              new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new window.Image();
                img.crossOrigin = 'anonymous';
                img.src = photo;
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
              })
          )
        );

        images.forEach((img, index) => {
          const x = borderWidth;
          const y = borderWidth + index * (singleHeight + padding);
          context.drawImage(img, x, y, singleWidth, singleHeight);
        });

        // get the font family from CSS variable
        const fontFamily = getComputedStyle(document.documentElement)
          .getPropertyValue('--font-mondwest-reg')
          .trim();

        // add text
        context.font = `20px ${fontFamily}`;
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText(selectedEventTitle, canvas.width / 2, 25);

        context.fillText(
          'Reliably Yours 💜 Walrus',
          canvas.width / 2,
          canvas.height - 20
        );

        const finalPhotoURL = canvas.toDataURL('image/png');
        setPhotoURL(finalPhotoURL);
        setShowModal(true);
        await uploadPhoto();
      }
    }

    setIsCapturing(false);
    setCountdown(null);

    if (jsConfettiRef.current) {
      jsConfettiRef.current.addConfetti({
        emojis: ['📷'],
        emojiSize: 100,
        confettiNumber: 24,
      });
    }
  };

  const uploadPhoto = async () => {
    if (!canvasRef.current) return;
    setIsUploading(true);

    try {
      const imageDataUrl = canvasRef.current.toDataURL('image/png');
      const blob = await fetch(imageDataUrl).then((res) => res.blob());

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: blob,
      });

      if (!response.ok) {
        console.error('Failed to upload image:', response.statusText);
        return;
      }

      const result = await response.json();

      if (result?.data?.newlyCreated?.blobObject) {
        // save to supabase
        const { data, error } = await supabase.from('photos').insert([
          {
            blob_id: result.data.newlyCreated.blobObject.blobId,
            object_id: result.data.newlyCreated.blobObject.id,
            created_at: new Date().toISOString(),
            event_id: selectedEventId,
          },
        ]).select();

        if (error) {
          console.error('Error saving to Supabase:', error);
          throw new Error('Failed to save to database');
        }
        
        if (data && data.length > 0) {
          setPhotoId(data[0].blob_id);
        }
        
        setIsUploaded(true);
      } else {
        console.error('Unexpected response structure:', result);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setIsUploaded(false);
    } finally {
      setIsUploading(false);
    }
  };

  const qrCodeValue = photoId ? `${baseUrl}/events/${selectedEventSlug}?photoId=${photoId}` : eventUrl;

  return (
    <>
      <div className='max-w-4xl w-full bg-black/80 rounded-xl shadow-2xl overflow-hidden'>
        <div className='p-6 space-y-6'>
          <div className='flex space-x-3 justify-center'>
            {!isCameraOn && (
              <Button
                onClick={startCamera}
                variant='default'
                className='min-w-[140px] transition-all duration-200 hover:scale-105'
              >
                <Camera className='mr-2 h-5 w-5' />
                Start Camera
              </Button>
            )}
            <Button
              onClick={takePhotoSequence}
              disabled={!isCameraOn || isCapturing}
              variant='secondary'
              className='min-w-[140px] transition-all duration-200 hover:scale-105'
            >
              <Camera className='mr-2 h-5 w-5' />
              {isCapturing ? 'Capturing...' : 'Take Photos'}
            </Button>
          </div>
          <div className='relative aspect-video bg-black rounded-lg overflow-hidden w-full shadow-xl border border-zinc-700'>
            <video
              ref={videoRef}
              autoPlay
              hidden={!isCameraOn}
              className='w-full h-full object-contain'
            />
            {!isCameraOn && (
              <div className='absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm'>
                <span className='text-zinc-400 text-xl font-medium'>
                  Camera Preview
                </span>
              </div>
            )}
            {countdown !== null && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm'>
                <span className='text-white text-8xl font-bold animate-pulse'>
                  {countdown || 'Snap!'}
                </span>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className='hidden' />
        </div>
        <div className='bg-black/80 backdrop-blur-sm text-white text-center py-3 text-base font-medium tracking-wider border-t border-zinc-700'>
          Sui Presents Walrus
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className='max-w-2xl bg-black/90 border-zinc-700 h-[90vh] flex flex-col'>
          <DialogHeader>
            <DialogTitle className='text-center text-2xl font-semibold mb-2 text-white'>
              Your Photo Strip
            </DialogTitle>
            <DialogClose
              className='absolute top-4 right-4 z-50 
                        bg-black/60 hover:bg-black/80
                        w-8 h-8
                        flex items-center justify-center
                        shadow-lg transition-all 
                        hover:scale-110 focus:outline-none'
              aria-label='Close dialog'
            >
              <span className='text-white text-xl leading-none font-semibold'>
                ×
              </span>
            </DialogClose>
          </DialogHeader>

          <div className='flex-1 flex flex-col justify-between min-h-0'>
            {photoURL && (
              <div className='flex-1 min-h-0 relative w-full rounded-lg overflow-hidden border border-zinc-700 bg-black/40 mb-4'>
                <div className='absolute inset-0'>
                  <Image
                    src={photoURL}
                    alt='Photo Strip'
                    fill
                    className='object-contain'
                    priority
                  />
                </div>
              </div>
            )}

            <div className='mt-auto border-t border-zinc-700/50 pt-4'>
              <div className='flex flex-col items-center justify-center gap-6 p-4'>
                {isUploading && (
                  <div className='flex items-center gap-2'>
                    <Loader2 className='animate-spin h-5 w-5 text-white' />
                    <span className='text-white'>Uploading...</span>
                  </div>
                )}
                {isUploaded && (
                  <div className='flex flex-col items-center gap-2'>
                    <div className='flex items-center gap-2'>
                      <Check className='h-5 w-5 text-green-500' />
                      <span className='text-white'>Upload Complete</span>
                    </div>
                    <div className='bg-white p-3 rounded-lg shadow-lg'>
                      <QRCode
                        value={qrCodeValue}
                        size={120}
                        style={{
                          height: 'auto',
                          maxWidth: '100%',
                          width: '100%',
                        }}
                        viewBox={`0 0 256 256`}
                        className='rounded'
                      />
                    </div>
                    <span className='text-zinc-400 text-sm'>
                      Scan to view your photo
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoBooth;
