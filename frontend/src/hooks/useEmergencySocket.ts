import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Subscribes to /topic/emergency/{emergencyId} for live status/route updates
 * and /topic/ambulance/{ambulanceId} for live position updates (including
 * DEMO SIMULATION MODE broadcasts).
 */
export function useEmergencySocket(emergencyId?: number, ambulanceId?: number) {
  const [ambulancePosition, setAmbulancePosition] = useState<{ latitude: number; longitude: number; status: string; etaMinutes?: number } | null>(null);
  const [lastEmergencyUpdate, setLastEmergencyUpdate] = useState<number>(0);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!emergencyId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('/ws') as unknown as WebSocket,
      reconnectDelay: 4000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/emergency/${emergencyId}`, (message) => {
        setLastEmergencyUpdate(Date.now());
        try {
          const payload = JSON.parse(message.body);
          if (payload && typeof payload.latitude === 'number' && typeof payload.longitude === 'number') {
            setAmbulancePosition({
              latitude: payload.latitude,
              longitude: payload.longitude,
              status: payload.status || 'EN_ROUTE',
              etaMinutes: payload.etaMinutes,
            });
          }
        } catch {
          // ignore
        }
      });

      if (ambulanceId) {
        const handleLocationFrame = (message: { body: string }) => {
          try {
            const payload = JSON.parse(message.body);
            if (payload && typeof payload.latitude === 'number' && typeof payload.longitude === 'number') {
              setAmbulancePosition({
                latitude: payload.latitude,
                longitude: payload.longitude,
                status: payload.status,
                etaMinutes: payload.etaMinutes,
              });
            }
          } catch {
            // ignore malformed frames
          }
        };

        client.subscribe(`/topic/ambulance/${ambulanceId}`, handleLocationFrame);
        client.subscribe(`/topic/fire/${ambulanceId}`, handleLocationFrame);
        client.subscribe(`/topic/police/${ambulanceId}`, handleLocationFrame);
      }
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [emergencyId, ambulanceId]);

  return { ambulancePosition, lastEmergencyUpdate };
}
