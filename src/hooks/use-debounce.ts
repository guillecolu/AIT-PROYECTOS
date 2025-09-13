
'use client';

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isInitial, setIsInitial] = useState(true);

  useEffect(() => {
    if (isInitial) {
        setIsInitial(false);
        setDebouncedValue(value);
        return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, isInitial]);

  return debouncedValue;
}
