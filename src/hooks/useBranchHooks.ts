import { useBranchContext } from '../contexts/Branch_Context';

// Convenience hooks for common operations
export const useBranchesContext = () => {
  const { branches, loading, error } = useBranchContext();
  return { branches, loading, error };
};

export const useSelectedBranch = () => {
  const { selectedBranch, setSelectedBranch } = useBranchContext();
  return { selectedBranch, setSelectedBranch };
};

export const useBranchById = (id: number) => {
  const { getBranchById } = useBranchContext();
  return getBranchById(id);
};

export const useRefreshBranches = () => {
  const { refreshBranches } = useBranchContext();
  return refreshBranches;
};
