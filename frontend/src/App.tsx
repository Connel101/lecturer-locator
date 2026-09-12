import Navbar from './Navbar'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Directory from "./Directory"
import SignInOut from "./SignInOut"
import Lecturers from "./Lecturers"
import Buildings from "./Buildings"

function App() {
  return (
    
   <BrowserRouter>
       <Navbar />

       <Routes>
        <Route path="/" element={<Directory />} />
       <Route path="/directory" element={<Directory />} />
        <Route path="/signin" element={<SignInOut />} />
         <Route path="/lecturers" element={<Lecturers />} />
         <Route path="/buildings" element={<Buildings />} /> 
       </Routes>
    </BrowserRouter>
  )
}

export default App