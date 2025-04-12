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

      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) {
        setError(error);
        console.error('Error fetching events:', error);
      } else {
        setEvents((events as Event[]) || []);
      }

      setIsLoading(false);
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchCurrentAdmin = async () => {
      setIsLoading(true);

      const { data: admins, error } = await supabase
        .from('admins')
        .select('id')
        .eq('email', emailAddress);

      if (error) {
        setError(error);
        console.error('Error fetching current admin:', error);
      } else {
        if (admins.length > 0) setCurrentAdminId(admins[0].id);
      }

      setIsLoading(false);
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

  if (error) {
    return <div>Error loading events</div>;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <main className='container mx-auto px-4 py-8'>
      <div className='flex items-center justify-between mb-8'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-4xl font-bold text-primary'>
            <span className='site-title'>Walrus Photo Booth</span>
          </h1>
          <p className='text-lg text-gray-600'>
            Click on an event to view photos from the event
          </p>
        </div>
        <div className='flex items-center gap-4'>
          {isConnected && currentAdminId && (
            <>
              <Link
                href='/addEvent'
                className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90'
              >
                Create your own event
              </Link>
              <Link
                href='/photo-booth'
                className='inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/90'
              >
                Photo Booth
              </Link>
            </>
          )}
          <ProfilePopover />
        </div>
      </div>

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
    </main>
  );
};

export default HomePage;
