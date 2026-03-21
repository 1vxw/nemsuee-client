import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import '@fontsource-variable/manrope/index.css'
import './index.css'
import App from './App.tsx'
import { Analytics } from "@vercel/analytics/next"

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
    <Analytics />
  </BrowserRouter>,
)


