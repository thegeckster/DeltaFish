import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import LogTrip from './pages/LogTrip'
import MyTrips from './pages/MyTrips'
import TripDetail from './pages/TripDetail'
import Analysis from './pages/Analysis'
import AskAI from './pages/AskAI'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log" element={<LogTrip />} />
        <Route path="/trips" element={<MyTrips />} />
        <Route path="/trips/:id" element={<TripDetail />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/ask" element={<AskAI />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
