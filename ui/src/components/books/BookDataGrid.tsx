import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useBooks } from '../../hooks/useBooks';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID' },
  { field: 'title', headerName: 'Title', flex: 1 },
  { field: 'author', headerName: 'Author', flex: 1 },
];

interface BooksDataGridProps {
  onError?: (error: string) => void;
  cols?: GridColDef[];
}

export const BooksDataGrid: React.FC<BooksDataGridProps> = ({
  onError,
  cols = columns,
}) => {
  const { data: books, isLoading: loading, error } = useBooks();

  if (error && onError) {
    onError(error.message);
  }

  return (
    <DataGrid
      showToolbar
      disableColumnSelector
      rows={books || []}
      columns={cols}
      loading={loading}
      label="Books"
      pageSizeOptions={[15, 10, 5]}
      initialState={{
        pagination: {
          paginationModel: { pageSize: 5, page: 0 },
        },
      }}
      slotProps={{
        toolbar: {
          printOptions: { disableToolbarButton: true },
          csvOptions: { disableToolbarButton: true },
        },
      }}
    />
  );
};
