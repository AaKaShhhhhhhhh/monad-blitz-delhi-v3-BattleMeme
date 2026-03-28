import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import CreateWar from './pages/CreateWar.jsx'
import WarDetail from './pages/WarDetail.jsx'

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateWar />} />
          <Route path="/war/:id" element={<WarDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
