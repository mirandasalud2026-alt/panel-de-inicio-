import { useDashboard } from '../contexts/DashboardContext';

/**
 * Custom React hook for unified access to Dashboard Context data and actions.
 */
export function useDashboardData() {
  const {
    reportes,
    asics,
    ejes,
    stats,
    isLoading,
    isSyncing,
    error,
    lastUpdate,
    selectedEje,
    selectedTab,
    setSelectedEje,
    setSelectedTab,
    fetchData,
    syncSheets
  } = useDashboard();

  return {
    reportes,
    asics,
    ejes,
    stats,
    isLoading,
    isSyncing,
    error,
    lastUpdate,
    selectedEje,
    selectedTab,
    setSelectedEje,
    setSelectedTab,
    fetchData,
    syncSheets
  };
}
