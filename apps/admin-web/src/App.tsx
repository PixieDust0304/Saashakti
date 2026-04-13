import { Routes, Route, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FieldWorker, BeneficiaryProfile, SchemeMatch } from './engine/types'
import HomePage from './pages/HomePage'
import IntakePage from './pages/IntakePage'
import ResultsPage from './pages/ResultsPage'
import DashboardPage from './pages/DashboardPage'
import Header from './components/layout/Header'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const pageTransition = { duration: 0.3, ease: 'easeInOut' }

export default function App() {
  const location = useLocation()
  const [fieldWorker, setFieldWorker] = useState<FieldWorker | null>(null)
  const [profile, setProfile] = useState<BeneficiaryProfile | null>(null)
  const [matches, setMatches] = useState<SchemeMatch[]>([])

  return (
    <div className="min-h-screen relative">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div
                key="/"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <HomePage onFieldWorkerLogin={setFieldWorker} />
              </motion.div>
            }
          />
          <Route
            path="/register"
            element={
              <motion.div
                key="/register"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <Header fieldWorker={fieldWorker} />
                <IntakePage
                  fieldWorker={fieldWorker}
                  onComplete={(p, m) => {
                    setProfile(p)
                    setMatches(m)
                  }}
                />
              </motion.div>
            }
          />
          <Route
            path="/results"
            element={
              <motion.div
                key="/results"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
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
              </motion.div>
            }
          />
          <Route
            path="/dashboard"
            element={
              <motion.div
                key="/dashboard"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
              >
                <DashboardPage />
              </motion.div>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
