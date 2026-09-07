import { useState } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { faUser } from '@fortawesome/free-solid-svg-icons'
import { Link } from "react-router-dom"

function Navbar() {
  const [menu, setMenu] = useState(false)

  return (
    <nav className="relative h-12 w-full bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
            <button
                type="button"
                onClick={() => setMenu(!menu)}
                className="text-blue-900 hover:text-blue-700"
            >
          <FontAwesomeIcon icon={faBars} />
        </button>
            <span className="text-sm font-semibold text-blue-900">
                LecturerLocator
            </span>
        </div>
        <button
        type="button"
        className="text-blue-900 hover:text-blue-700"
         >
        <FontAwesomeIcon icon={faUser} />
      </button>
       
       {menu && (
        <div className="absolute top-12 left-0 w-48 bg-white border border-gray-200 shadow-md">
            <Link
            to="/directory"
            onClick={() => setMenu(false)}
            className="block w-full px-4 py-3 hover:bg-gray-100"
          >
            Directory
          </Link>

          <Link
            to="/signin"
            onClick={() => setMenu(false)}
            className="block w-full px-4 py-3 hover:bg-gray-100"
          >
            Sign In / Out
          </Link>
        </div>
      )}
              
    </nav>
  );
}

export default Navbar;