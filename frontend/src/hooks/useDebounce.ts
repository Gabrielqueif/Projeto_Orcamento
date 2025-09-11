// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Limpa o timeout anterior a cada renderização
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}