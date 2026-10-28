import { useEffect, useState } from "react";

// useState que recuerda su valor en localStorage (tolera que el almacenamiento no esté disponible).
export default function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // sin almacenamiento: el valor solo vive en memoria
    }
  }, [key, value]);

  return [value, setValue];
}
