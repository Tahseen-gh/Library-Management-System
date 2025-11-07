import {
  Box,
  InputLabel,
  FormControl,
  MenuItem,
  Select,
  Skeleton,
  type SelectChangeEvent,
} from '@mui/material';
import {
  useBranchesContext,
  useSelectedBranch,
} from '../../hooks/useBranchHooks';

interface BranchSelectorProps {
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  width?: string | number | object;
  label?: string;
}

export const BranchSelector = ({
  size = 'small',
  fullWidth = true,
  width,
  label = 'Branch',
}: BranchSelectorProps) => {
  const { branches, loading } = useBranchesContext();
  const { selected_branch, set_selected_branch } = useSelectedBranch();

  const handle_change_branch = (event: SelectChangeEvent) => {
    const branch_id = parseInt(event.target.value);
    const branch = branches.find((b) => b.id == branch_id);
    if (branch) {
      set_selected_branch(branch);
    }
  };

  if (loading) {
    return (
      <Skeleton
        variant="rectangular"
        sx={{
          width: width || { xs: 150, sm: 175, md: 'calc(5rem + 100px)' },
          height: size === 'small' ? 40 : 56,
        }}
      />
    );
  }

  const content = (
    <FormControl fullWidth={fullWidth} size={size}>
      <InputLabel id="branch-select-label">{label}</InputLabel>
      <Select
        size={size}
        label={label}
        labelId="branch-select-label"
        id="branch-select"
        value={selected_branch?.id.toString() || ''}
        onChange={handle_change_branch}
      >
        {branches &&
          branches.map((branch) => (
            <MenuItem key={branch.id} value={branch.id.toString()}>
              {branch.branch_name}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );

  if (width) {
    return <Box sx={{ width }}>{content}</Box>;
  }

  return content;
};
