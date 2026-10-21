import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { getToken } from './api'
import Login from './Login'
import MemberList from './MemberList'
import MemberForm from './MemberForm'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => getToken() !== null)

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  return (
    <Routes>
      <Route path="/" element={<MemberList onLogout={() => setLoggedIn(false)} />} />
      <Route path="/members/new" element={<MemberForm />} />
      <Route path="/members/:id/edit" element={<MemberForm />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}