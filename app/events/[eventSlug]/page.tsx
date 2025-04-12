'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import ProfilePopover from '@/components/ProfilePopover';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@radix-ui/react-icons';
import Loading from '@/components/Loading';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const AGGREGATOR_URL = process.env.NEXT_PUBLIC_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';

interface Photo {
  id: number;
  created_at: string;
  blob_id: string;
  object_id: string;
  event_id: number;
  user: string | null;
}

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  event_slug: string;
  event_date: string;
  admin_id: number;
}

interface DateTimeFormatOptions {
  weekday?: 'narrow' | 'short' | 'long';
  month?: 'narrow' | 'short' | 'long' | 'numeric' | '2-digit';
  day?: 'numeric' | '2-digit';
  year?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  hour12?: boolean;
  timeZoneName?: 'short' | 'long';
}

const fadeInAnimation = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`;

const PhotosPage = ({ params }: { params: Promise<{ eventSlug: string }> }) => {
  const resolvedParams = use(params);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  const { isConnected, emailAddress } = useCustomWallet();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const photoId = urlParams.get('photoId');
    if (photoId) {
      setSelectedPhotoId(photoId);
    }
  }, []);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!eventDetails?.id) return;

      setIsLoading(true);
      const { data, error } = await supabase
        .from('photos')
        .select('blob_id, object_id, event_id, created_at')
        .eq('event_id', eventDetails?.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error);
        console.error('Error fetching photos:', error);
      } else {
        setPhotos((data as Photo[]) || []);
      }
      setIsLoading(false);
    };

    fetchPhotos();
  }, [eventDetails?.id]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      setIsLoading(true);
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_slug', resolvedParams.eventSlug);

      if (error) {
        setError(error);
        console.error('Error fetching event details:', error);
      } else {
        if (events[0]) {
          const options: DateTimeFormatOptions = {
            month: 'long',
            day: '2-digit',
            year: 'numeric',
          };
          const id = events[0].id;
          const et = events[0].event_title.toUpperCase();
          const ed = new Date(events[0].event_date).toLocaleString([], options);
          const ca = new Date(events[0].created_at).toString();
          const ai = events[0].admin_id;
          setEventDetails({
            id: id,
            event_title: et,
            event_date: ed,
            created_at: ca,
            admin_id: ai,
          } as Event);
        }
      }
      setIsLoading(false);
    };

    fetchEventDetails();
  }, [resolvedParams.eventSlug]);

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      setIsLoading(true);
      const { data: admins, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', emailAddress);

      if (error) {
        setError(error);
        console.error('Error fetching admin:', error);
      } else {
        if (admins.length > 0) setCurrentAdminId(admins[0].id);
      }
      setIsLoading(false);
    };

    fetchCurrentAdmin();
  }, [emailAddress]);

  const handleDeletePhoto = async (blob_id: string) => {
    setIsLoading(true);

    const { error } = await supabase
      .from('photos')
      .delete()
      .eq('blob_id', blob_id);

    if (error) {
      setError(error);
      console.error('Error deleting photo:', error);
    } else {
      setPhotos(photos.filter((photo) => photo.blob_id !== blob_id));
    }
    setIsLoading(false);
  };

  if (error) {
    return <div>Error loading photos</div>;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <main className='min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-white dark:from-sky-900 dark:via-blue-900 dark:to-gray-900'>
      <div className='container mx-auto px-4 py-12'>
        <div
          className='w-full flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 
                       bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm 
                       rounded-xl p-6 shadow-lg'
        >
          <div className='space-y-2'>
            <h1 className='text-4xl font-bold text-gray-900 dark:text-white'>
              {eventDetails?.event_title}
            </h1>
            <h2 className='text-lg text-gray-600 dark:text-gray-300'>
              {eventDetails?.event_date}
            </h2>
            <Link
              href='/'
              className='inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors'
            >
              ← Back to Events
            </Link>
          </div>

          <div className='flex items-center gap-4'>
            {isConnected && currentAdminId && (
              <>
                <Link
                  href='/addEvent'
                  className='flex items-center justify-center rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors py-2.5 px-6'
                >
                  + Event
                </Link>
                <Link
                  href='/photo-booth'
                  className='flex items-center justify-center rounded-lg text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors py-2.5 px-6'
                >
                  Photo Booth
                </Link>
              </>
            )}
            <ProfilePopover />
          </div>
        </div>

        {photos.length === 0 ? (
          <div className='text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl'>
            <p className='text-lg text-gray-600 dark:text-gray-400'>
              No photos found for this event yet.
            </p>
          </div>
        ) : (
          <>
            <style>{fadeInAnimation}</style>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 p-3'>
              {photos.map((photo, index) => (
                <div
                  key={photo.blob_id}
                  style={{
                    animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`,
                  }}
                  className='relative bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-sm
                             aspect-square flex flex-col items-center justify-center mb-3
                             transform-gpu hover:scale-[1.02] hover:shadow-lg transition-all duration-300
                             break-inside-avoid group'
                >
                  <div
                    className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 
                                transition-all duration-300 rounded-lg'
                  />

                  <Dialog open={selectedPhotoId === photo.blob_id} onOpenChange={(isOpen) => setSelectedPhotoId(isOpen ? photo.blob_id : null)}>
                    <DialogTrigger asChild>
                      <div 
                        className='relative w-[80%] h-full cursor-pointer z-10'
                        onClick={() => setSelectedPhotoId(photo.blob_id)}
                      >
                        <Image
                          src={`${AGGREGATOR_URL}/v1/blobs/${photo.blob_id}`}
                          alt={`Photo ${photo.blob_id}`}
                          className='rounded-md transition-all duration-300 object-contain'
                          fill
                          sizes='(max-width: 768px) 40vw, 25vw'
                          style={{ transform: 'translateZ(0)' }}
                        />
                        <div className='absolute inset-0 flex items-center justify-center'>
                          <span className='opacity-0 group-hover:opacity-100 text-white text-sm bg-black px-3 py-1 rounded-full transition-opacity'>
                            View
                          </span>
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent
                      className='max-w-[80vw] max-h-[80vh] p-0 !bg-black/80 border-none 
                                             data-[state=open]:!bg-black/80 dark:!bg-black/80'
                    >
                      <DialogTitle className='sr-only'>
                        Photo from {eventDetails?.event_title}
                      </DialogTitle>
                      <div className='relative w-full h-[80vh] !bg-black/80'>
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
                        <Image
                          src={`${AGGREGATOR_URL}/v1/blobs/${photo.blob_id}`}
                          alt={`Photo ${photo.blob_id}`}
                          className='object-contain transition-opacity duration-300'
                          fill
                          sizes='80vw'
                          priority
                        />
                        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm'>
                          <span className=''>
                            Tap and hold image to download
                          </span>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {isConnected && eventDetails?.admin_id === currentAdminId && (
                    <div className='mt-3 w-full z-10'>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className='w-full bg-red-600/90 hover:bg-red-700 text-white transition-colors text-sm'>
                            <TrashIcon className='mr-2 h-3 w-3' />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className='bg-white dark:bg-gray-800'>
                          <AlertDialogHeader>
                            <AlertDialogTitle className='text-gray-900 dark:text-white'>
                              Are you sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription className='text-gray-600 dark:text-gray-400'>
                              Delete photo {photo.blob_id}? This action cannot
                              be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className='bg-gray-100 hover:bg-gray-200 text-gray-900'>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeletePhoto(photo.blob_id)}
                              className='bg-red-600 hover:bg-red-700 text-white'
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default PhotosPage;
