import { useState } from 'react'
import { getToken } from './api'
import Login from './Login'
import MemberList from './MemberList'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(() => getToken() !== null)

  return loggedIn
    ? <MemberList onLogout={() => setLoggedIn(false)} />
    : <Login onLogin={() => setLoggedIn(true)} />
}