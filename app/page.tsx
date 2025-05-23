'use client';

import { useState, useEffect } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { createClient } from '@supabase/supabase-js';
import ProfilePopover from '@/components/ProfilePopover';
import Loading from '@/components/Loading';
import Link from 'next/link';
import { EventCard } from '@/components/EventCard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  event_slug: string;
  admin_id: number;
  event_date: string;
}

const HomePage: React.FC = () => {
  const { isConnected, emailAddress } = useCustomWallet();

  const [isLoading, setIsLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);

      try {
        const { data: events, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: false });

        if (error) throw error;

        setEvents((events as Event[]) || []);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      setIsLoading(true);

      try {
        const { data: admins, error } = await supabase
          .from('admins')
          .select('id')
          .eq('email', emailAddress);

        if (error) throw error;

        if (admins.length > 0) setCurrentAdminId(admins[0].id);
      } catch (error) {
        console.error('Error fetching current admin:', error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentAdmin();
  }, [emailAddress]);

  const handleDeleteEvent = async (id: number) => {
    setIsLoading(true);

    try {
      // delete all photos associated with the event
      const { error: photosError } = await supabase
        .from('photos')
        .delete()
        .eq('event_id', id);

      if (photosError) throw photosError;

      // delete the event
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (eventError) throw eventError;

      setEvents(events.filter((event) => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <main className='container mx-auto px-4 py-8'>
      <div className='flex items-center justify-between mb-8'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-4xl font-bold'>
            <span className='site-title'>Walrus Photo Booth</span>
          </h1>
          <p className='text-lg'>
            Click on an event to view photos from the event
          </p>
        </div>
        <div className='flex items-center gap-4'>
          {isConnected && currentAdminId && (
            <>
              <Link
                href='/addEvent'
                className='inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-walrus-black text-walrus-teal hover:bg-walrus-grey'
              >
                Create your own event
              </Link>
              <Link
                href='/photo-booth'
                className='inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-walrus-teal hover:bg-walrus-grey'
              >
                Photo Booth
              </Link>
            </>
          )}
          <ProfilePopover />
        </div>
      </div>

      {error ? (
        <div className='grid grid-cols-1 p-6 text-center'>
          <h2>Oops! There was an error fetching events. Please try again!</h2>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isConnected={isConnected}
              currentAdminId={currentAdminId}
              onDelete={handleDeleteEvent}
            />
          ))}
        </div>
      )}
    </main>
  );
};

export default HomePage;
