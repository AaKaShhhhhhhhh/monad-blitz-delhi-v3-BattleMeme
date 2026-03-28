import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Background3D from './components/Background3D.jsx'
import Home from './pages/Home.jsx'
import CreateWar from './pages/CreateWar.jsx'
import WarDetail from './pages/WarDetail.jsx'
import AdminPanel from './pages/AdminPanel.jsx'
import NotFound from './pages/NotFound.jsx'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <BrowserRouter>
      <Background3D />
      <Header />
      <div className="relative z-[1] max-w-4xl mx-auto px-4 pb-12 pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateWar />} />
          <Route path="/war/:id" element={<WarDetail />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
    </BrowserRouter>
  )
}

export default App
