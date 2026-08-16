import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import AdaptiveSolutionsPage from './pages/AdaptiveSolutionsPage.jsx'
import SolutionsPage from './pages/SolutionsPage.jsx'
import SolPage from './pages/SolPage.jsx'
import TestSolPage from './pages/TestSolPage.jsx'
import TestSol2Page from './pages/TestSol2Page.jsx'
import AboutPage from './pages/AboutPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import TermsPage from './pages/TermsPage.jsx'
import CapabilityDetailPage from './pages/CapabilityDetailPage.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/solutions" element={<AdaptiveSolutionsPage />} />
      <Route path="/sol" element={<SolPage />} />
      <Route path="/testsol" element={<TestSolPage />} />
      <Route path="/testsol1" element={<SolutionsPage />} />
      <Route path="/testsol2" element={<TestSol2Page />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/capabilities/deep-technology" element={<CapabilityDetailPage />} />
    </Routes>
  )
}

export default App
