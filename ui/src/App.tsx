import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { Home } from './pages/Home';
import { LibraryItemsPage } from './pages/LibraryItemsPage';
import { MyBooks } from './pages/MyBooks';
import { AdminPanel } from './pages/AdminPanel';
import { Dashboard } from './pages/Dashboard';
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
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="library-items" element={<LibraryItemsPage />} />
          <Route path="my-books" element={<MyBooks />} />
          <Route path="patrons" element={<Patrons />} />
          <Route path="patron">
            <Route path=":patron_id" element={<PatronPage />} />
          </Route>
          <Route path="admin" element={<AdminPanel />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="checkin" element={<CheckInItem />} />
          <Route path="checkout" element={<CheckOutItem />} />
          <Route path="reshelve" element={<ReshelveItemPage />} />
          <Route path="mark-available" element={<MarkAvailablePage />} />
          <Route path="books">
            <Route path=":book_id" element={<BookPage />} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
