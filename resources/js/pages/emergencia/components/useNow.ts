import { useEffect, useState } from 'react';

/** Current time, refreshed every minute (elapsed times on the board) */
export default function useNow(): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(id);
    }, []);
    return now;
}
