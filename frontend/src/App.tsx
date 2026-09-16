import Scan from './Scan'
import LecturerProfileLayout from './LecturerProfileLayout'
import RouteDirections from './RouteDirections'
import Navbar from './Navbar'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Directory from "./Directory"
import SignInOut from "./SignInOut"
import Lecturers from "./Lecturers"
import Buildings from "./Buildings"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLocationDot } from "@fortawesome/free-solid-svg-icons"
import LecturersInformation from './LecturersInformation'


function Map() {
  return (
    <main className="page-shell feature-page">
      <div className="feature-icon" aria-hidden="true"><FontAwesomeIcon icon={faLocationDot} /></div>
      <h1>Campus map</h1>
      <p>Your route will appear here after you select or scan a lecturer.</p>
    </main>
  )
}

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
         <Route path="/scan" element={<Scan />} />
         <Route path="/map" element={<Map />} />
         <Route
  path="/lecturers/info/:id"
  element={<LecturerProfileLayout />}>
    <Route index element={<LecturersInformation />} />
    <Route path="directions" element={<RouteDirections />} />
  </Route>
       </Routes>
    </BrowserRouter>
  )
}

export default App
