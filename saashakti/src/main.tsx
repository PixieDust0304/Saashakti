import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LangProvider } from './hooks/useLang'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <LangProvider>
      <App />
    </LangProvider>
  </BrowserRouter>,
)
