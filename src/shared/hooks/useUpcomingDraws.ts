import { useState, useEffect } from "react";
import { BACKEND_URL } from "@/shared/lib/api";

export interface UpcomingRaffle {
  id: string;
  name: string;
  drawDate: string;
  status: string;
}

export function useUpcomingDraws(minutesThreshold: number = 10) {
  const [upcomingDraws, setUpcomingDraws] = useState<UpcomingRaffle[]>([]);
  const [closestDraw, setClosestDraw] = useState<UpcomingRaffle | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchUpcoming = async () => {
      try {
        // Obtenemos los sorteos que sucederán en los próximos X minutos
        const res = await fetch(`${BACKEND_URL}/raffles/upcoming?minutes=${minutesThreshold}`);
        if (!res.ok) return;
        const data: UpcomingRaffle[] = await res.json();
        
        setUpcomingDraws(data);

        if (data.length > 0) {
          // El backend ya los ordena ascendentemente por drawDate
          setClosestDraw(data[0]);
        } else {
          setClosestDraw(null);
        }
      } catch (err) {
        console.error("Error fetching upcoming draws:", err);
      }
      
      // Polling cada 30 segundos
      timeoutId = setTimeout(fetchUpcoming, 30000);
    };

    fetchUpcoming();

    return () => clearTimeout(timeoutId);
  }, [minutesThreshold]);

  return { upcomingDraws, closestDraw };
}
