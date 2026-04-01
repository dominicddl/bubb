import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { PrivacyPolicy } from './pages/PrivacyPolicy.tsx'
import { Terms } from './pages/Terms.tsx'
import { Onboarding } from './pages/Onboarding.tsx'
import { Layout } from './Layout.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
        <Route path="/terms" element={<Layout><Terms /></Layout>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
