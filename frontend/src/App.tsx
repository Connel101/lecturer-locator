import Scan from './Scan'
import LecturerProfileLayout from './LecturerProfileLayout'
import RouteDirections from './RouteDirections'
import LecturerTimetable from './LecturerTimetable'
import Navbar from './Navbar'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Directory from "./Directory"
import SignInOut from "./SignInOut"
import Lecturers from "./Lecturers"
import Buildings from "./Buildings"
import RouteEditor from "./RouteEditor"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLocationDot } from "@fortawesome/free-solid-svg-icons"
import LecturersInformation from './LecturersInformation'
import ProtectedRoute from "./ProtectedRoute";
import LecturerEdit from './LecturerEdit'
import LecturerCreate from './LecturerCreate'
import AdminMenu from './AdminMenu'


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
      <Route path="/scan" element={<Scan />} />
      <Route path="/map" element={<Map />} />  
      <Route
      path="/lecturers/info/:id"
      element={<LecturerProfileLayout />}>
      <Route index element={<LecturersInformation />} />
      <Route path="directions" element={<RouteDirections />} />
      <Route path="timetable" element={<LecturerTimetable />} /></Route>

      <Route element={<ProtectedRoute />}>
      <Route path="/admin" element={<AdminMenu />} />
      <Route path="/lecturers" element={<Lecturers />} />
      <Route path="/buildings" element={<Buildings />} />
      <Route path="/buildings/routes/new" element={<RouteEditor />} />
      <Route path="/buildings/routes/:routeId/edit" element={<RouteEditor />} />
      <Route
      path="/lecturer/edit/:id"
      element={<LecturerProfileLayout />}>
      <Route index element={<LecturerEdit />} />
      </Route>
      <Route path="/lecturer/create" element={<LecturerCreate />} />
      </Route>
    </Routes>

       
    </BrowserRouter>
  )
}

export default App
