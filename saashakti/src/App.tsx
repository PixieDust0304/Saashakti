import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import type { FieldWorker, BeneficiaryProfile, SchemeMatch } from './engine/types'
import HomePage from './pages/HomePage'
import IntakePage from './pages/IntakePage'
import ResultsPage from './pages/ResultsPage'
import DashboardPage from './pages/DashboardPage'
import Header from './components/layout/Header'

export default function App() {
  const [fieldWorker, setFieldWorker] = useState<FieldWorker | null>(null)
  const [profile, setProfile] = useState<BeneficiaryProfile | null>(null)
  const [matches, setMatches] = useState<SchemeMatch[]>([])

  return (
    <div className="min-h-screen relative">
      <Routes>
        <Route
          path="/"
          element={
            <div className="animate-fade-in">
              <HomePage onFieldWorkerLogin={setFieldWorker} />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div className="animate-fade-in">
              <Header fieldWorker={fieldWorker} />
              <IntakePage
                fieldWorker={fieldWorker}
                onComplete={(p, m) => {
                  setProfile(p)
                  setMatches(m)
                }}
              />
            </div>
          }
        />
        <Route
          path="/results"
          element={
            <div className="animate-fade-in">
              <Header fieldWorker={fieldWorker} />
              <ResultsPage
                profile={profile}
                matches={matches}
                fieldWorker={fieldWorker}
                onRegisterNext={() => {
                  setProfile(null)
                  setMatches([])
                }}
              />
            </div>
          }
        />
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />
      </Routes>
    </div>
  )
}
