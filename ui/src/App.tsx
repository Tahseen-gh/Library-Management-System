import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { HomePage } from './pages/HomePage';
import { LibraryItemsPage } from './pages/LibraryItemsPage';
import { MyBooks } from './pages/MyBooks';
import { DashboardPage } from './pages/DashboardPage';
import { Patrons } from './pages/Patrons';
import { CheckInItem } from './pages/CheckInItem';
import { CheckOutItem } from './pages/CheckOutItem';
import { BookPage } from './pages/Book';
import { PatronPage } from './pages/PatronPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { MarkAvailablePage } from './pages/MarkAvailablePage';
import { ReshelveItemPage } from './pages/ReshelveItemPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="library-items" element={<LibraryItemsPage />} />
          <Route path="my-books" element={<MyBooks />} />
          <Route path="patrons" element={<Patrons />} />
          <Route path="patron">
            <Route path=":patron_id" element={<PatronPage />} />
          </Route>
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="checkin" element={<CheckInItem />} />
          <Route path="checkout" element={<CheckOutItem />} />
          <Route path="reshelve" element={<ReshelveItemPage />} />
          <Route path="available" element={<MarkAvailablePage />} />
          <Route path="books">
            <Route path=":book_id" element={<BookPage />} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
