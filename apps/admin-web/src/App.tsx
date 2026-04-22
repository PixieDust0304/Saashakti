import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import type { FieldWorker, BeneficiaryProfile, SchemeMatch } from './engine/types'
import HomePage from './pages/HomePage'
import IntakePage, { createInitialForm } from './pages/IntakePage'
import ResultsPage from './pages/ResultsPage'
import DashboardPage from './pages/DashboardPage'
import GrievancePage from './pages/GrievancePage'
import CoverageGapPage from './pages/CoverageGapPage'
import FollowUpPage from './pages/FollowUpPage'
import Header from './components/layout/Header'

export default function App() {
  const [fieldWorker, setFieldWorker] = useState<FieldWorker | null>(null)
  const [profile, setProfile] = useState<BeneficiaryProfile | null>(null)
  const [matches, setMatches] = useState<SchemeMatch[]>([])
  // Form state lives here so it survives route transitions (/register →
  // /results → /register via browser back). IntakePage owns the step
  // counter locally since those are UI-only
  // and resetting them on navigation is the desired behavior.
  const [form, setForm] = useState<Partial<BeneficiaryProfile>>(createInitialForm)

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
                form={form}
                setForm={setForm}
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
                  setForm(createInitialForm())
                }}
              />
            </div>
          }
        />
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />
        <Route
          path="/grievances"
          element={
            <div className="animate-fade-in">
              <GrievancePage />
            </div>
          }
        />
        <Route
          path="/coverage"
          element={
            <div className="animate-fade-in">
              <CoverageGapPage />
            </div>
          }
        />
        <Route
          path="/follow-up"
          element={
            <div className="animate-fade-in">
              <FollowUpPage />
            </div>
          }
        />
      </Routes>
    </div>
  )
}
