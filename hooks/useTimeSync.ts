import { useState, useEffect } from 'react';

const TIME_API_URL = 'https://worldtimeapi.org/api/ip';

export const useTimeSync = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>;

    const syncTime = async () => {
      try {
        const start = Date.now();
        const response = await fetch(TIME_API_URL);
        const data = await response.json();
        const end = Date.now();
        
        // Simple network latency adjustment (round trip / 2)
        const latency = (end - start) / 2;
        const serverTime = new Date(data.datetime).getTime();
        const localTime = Date.now();
        
        // Offset = Server Time - Local Time
        const newOffset = (serverTime - latency) - localTime;
        setOffset(newOffset);
        
        // Resync every hour
        retryTimeout = setTimeout(syncTime, 60 * 60 * 1000);
      } catch (error) {
        console.warn('Time sync failed, using local time. Retrying in 1 minute.', error);
        retryTimeout = setTimeout(syncTime, 60 * 1000);
      }
    };

    // Trigger sync
    syncTime();

    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  return offset;
};