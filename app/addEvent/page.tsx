'use client';

import { useEffect, useState } from 'react';
import { useCustomWallet } from '@/contexts/CustomWallet';
import { createClient } from '@supabase/supabase-js';
import ProfilePopover from '@/components/ProfilePopover';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z, ZodType } from 'zod';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Input } from '@/components/ui/input';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import Loading from '@/components/Loading';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const timezones = [
  { value: '-10:00', name: '(GMT -10:00) Hawaii' },
  { value: '-09:00', name: '(GMT -9:00) Alaska' },
  { value: '-08:00', name: '(GMT -8:00) Pacific Time (US & Canada)' },
  { value: '-07:00', name: '(GMT -7:00) Mountain Time (US & Canada)' },
  {
    value: '-06:00',
    name: '(GMT -6:00) Central Time (US & Canada), Mexico City',
  },
  {
    value: '-05:00',
    name: '(GMT -5:00) Eastern Time (US & Canada), Bogota, Lima',
  },
  {
    value: '-04:00',
    name: '(GMT -4:00) Atlantic Time (Canada), Caracas, La Paz',
  },
  { value: '-03:30', name: '(GMT -3:30) Newfoundland' },
  { value: '-03:00', name: '(GMT -3:00) Brazil, Buenos Aires, Georgetown' },
];
// Then use this array to populate your select element
const hours = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
const mins = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')) as [string, ...string[]];

type FormData = {
  eventTitle: string;
  eventSlug: string;
  eventDate: Date;
  eventTimeHour: string;
  eventTimeMin: string;
  eventTimeAMPM: string;
  eventTimezone: string;
};

const EventSchema: ZodType<FormData> = z.object({
  eventTitle: z
    .string({ required_error: 'Please enter an event name.' })
    .min(1, {
      message: 'Event name must be at least 1 character.',
    })
    .regex(/^[a-zA-Z0-9\s&@.,_\-'"]+$/, {
      message:
        'Input must contain only letters, numbers, spaces, &, @, ., _, or -, single quotes, or double quotes',
    })
    .trim()
    .toLowerCase(),
  eventSlug: z
    .string({ required_error: 'Please enter slug for the event url.' })
    .min(1, {
      message: 'Event slug must be at least 1 character.',
    })
    .regex(/^[a-zA-Z0-9\-]+$/, {
      message: 'Input must contain only letters, numbers, or -',
    })
    .trim()
    .toLowerCase(),
  eventDate: z.date({
    required_error: 'A date for this event is required.',
  }),
  eventTimeHour: z.enum(hours, {
    message: 'A time for this event is required.',
  }),
  eventTimeMin: z.enum(mins, {
    message: 'A time for this event is required.',
  }),
  eventTimeAMPM: z.enum(['AM', 'PM'], {
    message: 'Please select AM or PM.',
  }),
  eventTimezone: z.string({
    required_error: 'The timezone for this event is required.',
  }),
});

const AddEvent: React.FC = () => {
  const router = useRouter();
  const { isConnected, emailAddress } = useCustomWallet();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        if (admins.length > 0) {
          setCurrentAdminId(admins[0].id);
        } else {
          setCurrentAdminId(0);
        }
      }

      setIsLoading(false);
    };

    fetchCurrentAdmin();
  }, [emailAddress]);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  let hourIn12 = currentHour % 12;
  hourIn12 = hourIn12 === 0 ? 12 : hourIn12;
  const ampm = currentHour >= 12 ? 'PM' : 'AM';
  
  const minuteString = currentMinute.toString().padStart(2, '0');

  const getTimezoneOffset = () => {
    const offsetInMinutes = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(offsetInMinutes / 60);
    const formattedOffset = `${offsetInMinutes <= 0 ? '+' : '-'}${Math.floor(offsetHours)
      .toString()
      .padStart(2, '0')}:00`;
    return formattedOffset;
  };

  // 1. Define your form.
  const form = useForm<z.infer<typeof EventSchema>>({
    resolver: zodResolver(EventSchema),
    defaultValues: {
      eventTitle: '',
      eventSlug: '',
      eventTimeHour: hourIn12.toString(),
      eventTimeMin: minuteString,
      eventTimeAMPM: ampm,
      eventTimezone: getTimezoneOffset(),
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(formData: z.infer<typeof EventSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.

    // setIsLoading(true);

    let hr;

    if (formData.eventTimeAMPM === 'PM') {
      hr = parseInt(formData.eventTimeHour) + 12;
    } else {
      hr = formData.eventTimeHour;
    }

    const formattedTime = `${hr}:${formData.eventTimeMin}:00`;

    const date = new Date(formData.eventDate);

    const day = date.toLocaleString('en-US', { weekday: 'short' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    const dateNum = date.getDate();
    const year = date.getFullYear();

    const formattedDate = `${day} ${month} ${dateNum} ${year} ${formattedTime} ${formData.eventTimezone}`;

    setError(null);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          event_title: formData.eventTitle,
          admin_id: currentAdminId,
          event_date: formattedDate,
          event_slug: formData.eventSlug,
        },
      ])
      .select();

    if (error) {
      setError(error);
      // console.error('Error saving to database:', error);
      if (error.code === '23505') {
        setErrorMessage('Slug already taken, please enter a new slug.');
      } else {
        setErrorMessage(
          'There was an error saving your event, please reload the page and try again!'
        );
      }
    }

    if (data) {
      router.push('/');
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_BASE_URL || '';

  if (isLoading) {
    return <Loading />;
  }

  if (!isConnected) {
    return (
      <main className='container mx-auto'>
        <div className='min-h-screen w-full flex items-center justify-center p-4 relative'>
          <ProfilePopover />
        </div>
      </main>
    );
  }

  return (
    <main className='container mx-auto px-4 py-8'>
      <div className='w-full flex flex-col md:flex-row items-center justify-between relative mb-10'>
        <h1 className='text-3xl font-bold mb-4 md:mb-0'>Add New Event</h1>
        <div className='flex items-center gap-4'>
          {isConnected && (
            <Link
              href='/'
              className='flex items-center justify-center rounded-md text-sm text-white bg-gray-500 py-2 px-6'
            >
              Return Home
            </Link>
          )}
          <ProfilePopover />
        </div>
      </div>

      <div className='w-full max-w-md m-auto mb-10'>
        {error && <p className='text-red-500'>{errorMessage}</p>}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-8'
          >
            <FormField
              control={form.control}
              name='eventTitle'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Event Title <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type='text'
                      placeholder='Happy Birthday Sui'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='eventSlug'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Event Slug <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type='text'
                      placeholder='happy-birthday-sui'
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === ' ') {
                          e.preventDefault();
                        }
                      }}
                    />
                  </FormControl>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {form.getValues('eventSlug') ? `${baseUrl}/events/${form.getValues('eventSlug')}` : 'Enter a slug to see your event URL'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='eventDate'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Event Date <span className="text-red-500">*</span></FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Event Time <span className="text-red-500">*</span></FormLabel>
              <div className='flex flex-col md:flex-row gap-2 border p-2 rounded-md'>
                <FormField
                  control={form.control}
                  name='eventTimeHour'
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Hour' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hours.map((hr) => (
                            <SelectItem key={hr} value={hr}>
                              {hr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='eventTimeMin'
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Minute' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mins.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='eventTimeAMPM'
                  render={({ field }) => (
                    <FormItem>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='AM/PM' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key='am' value='AM'>
                            AM
                          </SelectItem>
                          <SelectItem key='pm' value='PM'>
                            PM
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </FormItem>

            <FormField
              control={form.control}
              name='eventTimezone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone <span className="text-red-500">*</span></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Timezone' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.name} value={tz.value}>
                          {tz.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type='submit' className='w-full'>Create Event</Button>
          </form>
        </Form>
      </div>
    </main>
  );
};
export default AddEvent;
