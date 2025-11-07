import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import type { Branch } from '../types';
import type { PropsWithChildren } from 'react';
import { useBranches } from '../hooks/useBranches';

interface BranchContextType {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  selected_branch: Branch | null;
  set_selected_branch: (branch: Branch | null) => void;
  get_branch_by_id: (id: number) => Branch | undefined;
  refresh_branches: () => Promise<void>;
}

const Branch_Context = createContext<BranchContextType | undefined>(undefined);

export const Branch_Provider = ({ children }: PropsWithChildren) => {
  const [selected_branch, set_selected_branch] = useState<Branch | null>(null);

  const {
    data: branches,
    isLoading: loading,
    refetch: refetch_branches,
    error,
  } = useBranches();

  const get_branch_by_id = useCallback(
    (id: number): Branch | undefined => {
      return branches?.find((branch) => branch.id === id);
    },
    [branches]
  );

  const refresh_branches = useCallback(async () => {
    await refetch_branches();
  }, [refetch_branches]);

  useEffect(() => {
    if (!selected_branch && branches && branches.length > 0) {
      set_selected_branch(branches.find((branch) => branch.is_main) || null);
    }
  }, [branches, selected_branch]);

  const contextValue: BranchContextType = {
    branches: branches || [],
    loading,
    error: error?.message || null,
    selected_branch: selected_branch,
    set_selected_branch,
    get_branch_by_id,
    refresh_branches,
  };

  return (
    <Branch_Context.Provider value={contextValue}>
      {children}
    </Branch_Context.Provider>
  );
};

export const useBranchContext = (): BranchContextType => {
  const context = useContext(Branch_Context);
  if (context === undefined) {
    throw new Error('useBranchContext must be used within a BranchProvider');
  }
  return context;
};
