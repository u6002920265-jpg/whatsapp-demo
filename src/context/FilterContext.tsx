import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

interface FilterContextType {
  selectedUsers: string[];
  toggleUser: (userName: string) => void;
  clearFilters: () => void;
  isUserSelected: (userName: string) => boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const toggleUser = useCallback((userName: string) => {
    setSelectedUsers(prev =>
      prev.includes(userName) ? prev.filter(u => u !== userName) : [...prev, userName]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedUsers(prev => (prev.length === 0 ? prev : []));
  }, []);

  const isUserSelected = useCallback(
    (userName: string) => selectedUsers.length === 0 || selectedUsers.includes(userName),
    [selectedUsers],
  );

  const value = useMemo(
    () => ({ selectedUsers, toggleUser, clearFilters, isUserSelected }),
    [selectedUsers, toggleUser, clearFilters, isUserSelected],
  );

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilter must be used within a FilterProvider');
  return context;
}
