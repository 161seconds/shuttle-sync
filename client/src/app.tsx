import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CourtDetail from './pages/CourtDetail';
import Payment from './pages/Payment';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        { }
        <Route path="/" element={<Dashboard />} />
        <Route path="/court/:id" element={<CourtDetail />} />
        <Route path="/payment/:bookingId" element={<Payment />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;