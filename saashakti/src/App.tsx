import { Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import type { FieldWorker, BeneficiaryProfile, SchemeMatch } from './engine/types'
import HomePage from './pages/HomePage'
import IntakePage from './pages/IntakePage'
import ResultsPage from './pages/ResultsPage'
import DashboardPage from './pages/DashboardPage'
import Header from './components/layout/Header'
import AnimatedBackground from './components/3d/AnimatedBackground'

/**
 * PageTransition
 *
 * Wraps each route's content in a .page-enter CSS animation container.
 * Uses a key based on the current pathname so the animation replays
 * on every navigation. Pure CSS — no framer-motion dependency.
 */
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [displayKey, setDisplayKey] = useState(location.pathname)

  useEffect(() => {
    setDisplayKey(location.pathname)
  }, [location.pathname])

  return (
    <div key={displayKey} className="page-enter">
      {children}
    </div>
  )
}

export default function App() {
  const [fieldWorker, setFieldWorker] = useState<FieldWorker | null>(null)
  const [profile, setProfile] = useState<BeneficiaryProfile | null>(null)
  const [matches, setMatches] = useState<SchemeMatch[]>([])

  return (
    <div className="min-h-screen relative">
      {/* Global animated background layer — orbs + particles + grid */}
      <AnimatedBackground />

      {/* Route content rendered above the background */}
      <div className="relative z-10">
        <Routes>
          <Route
            path="/"
            element={
              <PageTransition>
                <HomePage onFieldWorkerLogin={setFieldWorker} />
              </PageTransition>
            }
          />
          <Route
            path="/register"
            element={
              <PageTransition>
                <Header fieldWorker={fieldWorker} />
                <IntakePage
                  fieldWorker={fieldWorker}
                  onComplete={(p, m) => {
                    setProfile(p)
                    setMatches(m)
                  }}
                />
              </PageTransition>
            }
          />
          <Route
            path="/results"
            element={
              <PageTransition>
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
              </PageTransition>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PageTransition>
                <DashboardPage />
              </PageTransition>
            }
          />
        </Routes>
      </div>
    </div>
  )
}
