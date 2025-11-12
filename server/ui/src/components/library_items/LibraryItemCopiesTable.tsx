import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import type { Item_Copy, Branch } from '../../types';
import { get_condition_color, get_status_color } from '../../utils/colors';

interface CopiesTableProps {
  copies: Item_Copy[];
  branches: Branch[];
}

export const CopiesTable = ({ copies, branches }: CopiesTableProps) => {
  const get_branch_name = (branch_id: number): string => {
    return (
      branches.find((branch) => branch.id === branch_id)?.branch_name ||
      'Unknown'
    );
  };

  if (copies.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No copies available
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
      <Table
        sx={{
          minWidth: 0,
          width: '100%',
          '& .MuiTableCell-root': {
            padding: { xs: '8px 4px', sm: '16px' },
            fontSize: { xs: '0.5rem', sm: '0.875rem' },
          },
        }}
        aria-label="copies table"
        size="small"
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: { xs: 80, sm: 120 } }}>
              Copy ID
            </TableCell>
            <TableCell sx={{ minWidth: { xs: 60, sm: 100 } }}>Branch</TableCell>
            <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Status</TableCell>
            <TableCell sx={{ minWidth: { xs: 70, sm: 90 } }}>
              Condition
            </TableCell>
            <TableCell align="right" sx={{ minWidth: { xs: 50, sm: 70 } }}>
              Cost
            </TableCell>
            <TableCell sx={{ minWidth: { xs: 80, sm: 120 } }}>Notes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {copies.map((copy) => (
            <TableRow
              key={copy.id}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
                fontSize: { xs: '0.5rem', sm: '0.875rem' },
              }}
            >
              <TableCell component="th" scope="row">
                <Typography
                  title={copy.id.toString()}
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: { xs: 60, sm: 100 },
                  }}
                >
                  {copy.id.toString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: { xs: 50, sm: 80 },
                  }}
                  title={get_branch_name(copy.branch_id)}
                >
                  {get_branch_name(copy.branch_id)}
                </Typography>
              </TableCell>
              <TableCell>
                <Chip
                  label={copy.status}
                  color={get_status_color(copy.status)}
                  size="small"
                  sx={{
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    height: { xs: 20, sm: 24 },
                  }}
                />
              </TableCell>
              <TableCell>
                {copy.condition ? (
                  <Chip
                    label={copy.condition}
                    color={get_condition_color(copy.condition)}
                    variant="outlined"
                    size="small"
                    sx={{
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      height: { xs: 20, sm: 24 },
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    N/A
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 'medium',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ${copy.cost.toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell>
                {copy.notes ? (
                  <Typography
                    variant="body2"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: { xs: 60, sm: 100 },
                    }}
                    title={copy.notes}
                  >
                    {copy.notes}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    —
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
