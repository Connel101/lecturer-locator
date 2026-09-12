import { useState } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { Link } from "react-router-dom"

function Navbar() {
  const [menu, setMenu] = useState(false)
  const [signIn, setSignIn] = useState(false)
  return (
    <nav className="relative h-12 w-full bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={() => setMenu(!menu)}
                className="text-[#3C1053] hover:text-[#8539B6]"
            >
          <FontAwesomeIcon icon={faBars} />
        </button>
            <span className="text-sm font-semibold text-[#3C1053]">
                LecturerLocator
            </span>
        </div>
        <button
        type="button"
        className="text-[#3C1053] hover:text-[#8539B6]"
         >
        <FontAwesomeIcon icon={faUser} />
      </button>
       
       {menu && !signIn && (
        <div className="absolute top-12 left-0 w-48 bg-white border border-gray-200 shadow-md">
            <Link
            to="/directory"
            onClick={() => setMenu(false)}
            className="font-poppins font-semibold text-xs text-[#5F5E62] hover:bg-[#8539B6] block w-full px-4 py-3 hover:text-[#3C1053]"
          >
            Directory
          </Link>

          <Link
            to="/signin"
            onClick={() => {setMenu(false); setSignIn(true)}}
            className="font-poppins font-semibold text-xs text-[#5F5E62] block w-full px-4 py-3 hover:bg-[#8539B6] hover:text-[#3C1053]"
          >
            Sign In
          </Link>
        </div>
      )}

      {menu && signIn && (
        <div className="absolute top-12 left-0 w-48 bg-white border border-gray-200 shadow-md">
            <Link
            to="/lecturers"
            onClick={() => setMenu(false)}
            className="font-poppins font-semibold text-xs text-[#5F5E62] hover:bg-[#8539B6] block w-full px-4 py-3 hover:text-[#3C1053]"
          >
            Lecturers
          </Link>
 
          <Link
            to="/buildings"
            onClick={() => setMenu(false)}
            className="font-poppins font-semibold text-xs text-[#5F5E62] hover:bg-[#8539B6] block w-full px-4 py-3 hover:text-[#3C1053]"
          >
            Buildings
          </Link> 
          <Link
            to="/directory"
            onClick={() => { setMenu(false), setSignIn(false)}}
           className="font-poppins font-semibold text-xs text-[#5F5E62] block w-full px-4 py-3 hover:bg-[#8539B6] hover:text-[#3C1053]"
          >
            Sign Out
          </Link>
        </div>
      )}
              
    </nav>
  );
}

export default Navbar;