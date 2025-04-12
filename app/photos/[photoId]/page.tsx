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
import { useRouter } from 'next/navigation';
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

const PhotoPage = ({ params }: { params: Promise<{ photoId: string }> }) => {
  const resolvedParams = use(params);

  const router = useRouter();

  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const { isConnected, emailAddress } = useCustomWallet();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const photoId = resolvedParams.photoId;

  useEffect(() => {
    const fetchPhoto = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('photos')
        .select('blob_id, object_id, event_id, created_at')
        .eq('blob_id', resolvedParams.photoId)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error);
        console.error('Error fetching photo:', error);
      } else {
        setPhoto((data?.[0] as Photo) || null);
      }
      setIsLoading(false);
    };

    fetchPhoto();
  }, [resolvedParams.photoId]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!photo?.event_id) return;

      setIsLoading(true);
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', photo?.event_id);

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
          const es = events[0].event_slug;
          setEventDetails({
            id: id,
            event_title: et,
            event_slug: es,
            event_date: ed,
            created_at: ca,
            admin_id: ai,
          } as Event);
        }
      }
      setIsLoading(false);
    };

    fetchEventDetails();
  }, [photo]);

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
      router.push(`/events/${eventDetails?.event_slug || ''}`);
    }

    setIsLoading(false);
  };

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
              href={`/events/${eventDetails?.event_slug}`}
              className='inline-block text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors'
            >
              ← View all Event Pics
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

        {error ? (
          <div className='text-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl'>
            <p className='text-lg text-gray-600 dark:text-gray-400'>
              Error retrieving photo. Please try again.
            </p>
          </div>
        ) : (
          <>
            <style>{fadeInAnimation}</style>

            <div
              style={{
                animation: `fadeIn 0.6s ease-out 0.1s both`,
              }}
              className='relative bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-sm
                             aspect-square flex flex-col items-center justify-center mb-3
                             transform-gpu hover:scale-[1.02] hover:shadow-lg transition-all duration-300
                             break-inside-avoid group'
            >
              <div className='relative w-[80%] h-full cursor-pointer z-10'>
                <Image
                  src={`${AGGREGATOR_URL}/v1/blobs/${photoId}`}
                  alt={`Photo ${photoId}`}
                  className='rounded-md transition-all duration-300 object-contain'
                  fill
                  sizes='(max-width: 768px) 40vw, 25vw'
                  style={{ transform: 'translateZ(0)' }}
                />
              </div>

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
                          Delete photo {photoId}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className='bg-gray-100 hover:bg-gray-200 text-gray-900'>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeletePhoto(photoId)}
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
          </>
        )}
      </div>
    </main>
  );
};

export default PhotoPage;
