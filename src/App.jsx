import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Landing from './pages/Landing/Landing';
import BookCatalog from './pages/BookCatalog/BookCatalog';
import BookDetail from './pages/BookDetail/BookDetail';
import AuthorList from './pages/AuthorList/AuthorList';
import AuthorDetail from './pages/AuthorDetail/AuthorDetail';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import BookEditor from './pages/BookEditor/BookEditor';
import Packages from './pages/Packages/Packages';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import AuthCallback from './pages/AuthCallback/AuthCallback';
import CheckEmail from './pages/CheckEmail/CheckEmail';
import VerifyEmail from './pages/VerifyEmail/VerifyEmail';
import WriterRegister from './pages/WriterRegister/WriterRegister';
import WriterLogin from './pages/WriterLogin/WriterLogin';
import WriterDashboard from './pages/WriterDashboard/WriterDashboard';
import Payment from './pages/Payment/Payment';
import MyTransactions from './pages/MyTransactions/MyTransactions';
import BuyBook from './pages/BuyBook/BuyBook';
import './App.css';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
}

function WriterRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || (user.role !== 'writer' && user.role !== 'admin')) return <Navigate to="/writer/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/books" element={<BookCatalog />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/authors" element={<AuthorList />} />
          <Route path="/authors/:id" element={<AuthorDetail />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/books/new" element={<AdminRoute><BookEditor /></AdminRoute>} />
          <Route path="/admin/books/:id/edit" element={<AdminRoute><BookEditor /></AdminRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/verify" element={<VerifyEmail />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/writer/login" element={<WriterLogin />} />
          <Route path="/writer/register" element={<WriterRegister />} />
          <Route path="/writer/dashboard" element={<WriterRoute><WriterDashboard /></WriterRoute>} />
          <Route path="/payment/:id" element={<Payment />} />
          <Route path="/my-orders" element={<MyTransactions />} />
          <Route path="/buy/:id" element={<BuyBook />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
