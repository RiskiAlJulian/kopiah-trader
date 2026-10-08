import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import SplashScreen from './components/SplashScreen'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import MarketPage from './pages/MarketPage'
import SymbolPage from './pages/SymbolPage'
import CalculatorPage from './pages/CalculatorPage'
import LivePage from './pages/LivePage'
import NewsPage from './pages/NewsPage'
import AcademyPage from './pages/AcademyPage'
import AcademyDetailPage from './pages/AcademyDetailPage'
import JournalPage from './pages/JournalPage'
import AIPage from './pages/AIPage'
import CommunityPage from './pages/CommunityPage'
import PostDetailPage from './pages/PostDetailPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import ComingSoon from './pages/ComingSoon'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  return (
    <>
    {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/market" element={<MarketPage />} />
        <Route path="/market/:symbol" element={<SymbolPage />} />
        <Route path="/live" element={<LivePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/academy" element={<ProtectedRoute><AcademyPage /></ProtectedRoute>} />
        <Route path="/academy/:id" element={<ProtectedRoute><AcademyDetailPage /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AIPage /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/community/:id" element={<ProtectedRoute><PostDetailPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="*" element={<ComingSoon title="Halaman tidak ditemukan" />} />
      </Route>
    </Routes>
    </>
  )
}
