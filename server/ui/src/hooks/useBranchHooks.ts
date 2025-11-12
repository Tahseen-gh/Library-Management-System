import { useBranchContext } from '../contexts/Branch_Context';

// Convenience hooks for common operations
export const useBranchesContext = () => {
  const { branches, loading, error } = useBranchContext();
  return { branches, loading, error };
};

export const useSelectedBranch = () => {
  const { selected_branch, set_selected_branch } = useBranchContext();
  return { selected_branch, set_selected_branch };
};

export const useBranchById = (id: number) => {
  const { get_branch_by_id: getBranchById } = useBranchContext();
  return getBranchById(id);
};

export const useRefreshBranches = () => {
  const { refresh_branches } = useBranchContext();
  return refresh_branches;
};
