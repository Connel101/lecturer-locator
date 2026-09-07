import Navbar from './Navbar'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Directory from "./Directory"
import SignInOut from "./SignInOut"

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Directory />} />
        <Route path="/directory" element={<Directory />} />
        <Route path="/signin" element={<SignInOut />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App