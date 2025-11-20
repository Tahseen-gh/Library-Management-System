import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { HomePage } from './pages/HomePage';
import { LibraryItemsPage } from './pages/LibraryItemsPage';
import { Patrons } from './pages/Patrons';
import { BookPage } from './pages/Book';
import { PatronPage } from './pages/PatronPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { MarkAvailablePage } from './pages/MarkAvailablePage';
import { CheckInItem } from './pages/CheckInItem';
import { RenewItem } from './pages/RenewItem';
import Search from './pages/Search';
import Reserve from './pages/Reserve';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="library-items" element={<LibraryItemsPage />} />
          <Route path="patrons" element={<Patrons />} />
          <Route path="patron">
            <Route path=":patron_id" element={<PatronPage />} />
          </Route>
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="search" element={<Search />} />
          <Route path="reserve" element={<Reserve />} />
          <Route path="checkin" element={<CheckInItem />} />
          <Route path="renew" element={<RenewItem />} />
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
