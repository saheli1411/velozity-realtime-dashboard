import { useSearchParams } from 'react-router-dom';

export const useTaskFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const dueRange = searchParams.get('dueRange') || '';

  const setFilter = (key: string, value: string) => {
    setSearchParams(prev => {
      const updated = new URLSearchParams(prev);
      if (value) updated.set(key, value);
      else updated.delete(key);
      return updated;
    });
  };

  return { status, priority, dueRange, setFilter, searchParams };
};