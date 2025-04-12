import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { TrashIcon } from '@radix-ui/react-icons';
import Image from 'next/image';

interface Event {
  id: number;
  created_at: string;
  event_title: string;
  admin_id: number;
  event_date: string;
  event_slug: string;
  photo_url?: string;
}

interface EventCardProps {
  event: Event;
  isConnected: boolean;
  currentAdminId: number | null;
  onDelete: (id: number) => void;
}

export const EventCard = ({
  event,
  isConnected,
  currentAdminId,
  onDelete,
}: EventCardProps) => {
  return (
    <div className='rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl'>
      <Link href={`/events/${event.event_slug}`} className='block'>
        <div className='relative aspect-[16/9] overflow-hidden rounded-t-lg'>
          <Image
            src={event.photo_url || '/brand-image-walrus.png'}
            alt={event.event_title}
            fill
            className='object-cover'
          />
        </div>
        <div className='p-6'>
          <h2 className='text-xl font-semibold mb-2'>
            {event.event_title.toUpperCase()}
          </h2>
          <p className='text-gray-600 mb-2'>
            {new Date(event.event_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </Link>
      {isConnected && event.admin_id === currentAdminId && (
        <div className='px-6 pb-4'>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='destructive' size='sm'>
                <TrashIcon className='mr-2 h-4 w-4' />
                Delete Event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  event and all associated photos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(event.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};
