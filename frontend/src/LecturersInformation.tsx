import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faClock,
  faDiamondTurnRight,

} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useLecturerProfile } from './lecturer-profile';

function LecturersInformation() {
  const lecturer = useLecturerProfile();
  return (


    // <main className="mx-auto px-24 py-8 max-[640px]:px-12 max-[640px]:pb-28 grid grid-cols-1 gap-4 px-4 pb-6 pt-4 md:grid-cols-3 lg:grid-cols-3">
    <main className="page-shell profile-page">
      <Link className="route-link" to="/directory">← Back to directory</Link>
      {/* Lecture's Details */}
    <section className="overflow-hidden rounded-[5px] border border-[#ece7ed] bg-white shadow-sm md:col-span-1 md:row-span-2">
      <div className="flex flex-col items-center px-4 pb-3 pt-4">

           <div className="h-[82px] w-[70px] overflow-hidden rounded-[4px] border border-[#e2dce4] bg-[#eee9ef]">
             <img
              
               alt={lecturer.fullName }
               className="h-full w-full object-cover"
             />
           </div>

           <h1 className="text-center mt-2 font-bold text-[#4b145f]">
             {lecturer.fullName}
            
           </h1>

           <p className="mt-0.5 text-[#4d3b51]">
             {lecturer.title}, {lecturer.department}
           </p>

           <div className="mt-2 flex flex-wrap justify-center gap-1.5">
             
               {lecturer.modules.map((module) => (
                  <span className="rounded-full border border-[#e2d2e7] bg-[#f7f0f9] px-2 py-0.5  font-semibold text-[#5a1b70]" key={module.code}>
                    {module.code}
                  </span>
                ))}
             
           </div>
           <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  <span className="rounded-full border border-[#e2d2e7] bg-[#f7f0f9] px-2 py-0.5  font-semibold text-[#5a1b70]" >
                    {lecturer.researchArea}
                  </span>
             
           </div>
         </div>
       </section>

       {/* Contact & Location */}
       <section className="mt-3 rounded-[5px] border border-[#ece7ed] bg-white p-3 shadow-sm">

         <h2 className=" font-bold text-[#4b145f ] mb-4">
            Location
         </h2>

           {/* Office */}
          <div className="flex gap-2">
            <FontAwesomeIcon icon={faBuilding} />
          <div>
          <p className="font-semibold text-[#4a3a4e]">
            Office
          </p>

          <p className="leading-3 text-[#56465a]">
            {lecturer.office ? `${lecturer.office.buildingName ?? 'Building unavailable'}, room ${lecturer.office.roomNumber}` : 'Office not assigned'}
          </p>

          </div>
          </div>

          <Link
            to="directions"
            className="primary-button mt-4 flex min-h-14 w-full items-center justify-center gap-3 text-center no-underline transition-colors hover:bg-[#52166e] active:bg-[#2b0b3c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8539b6] motion-reduce:transition-none"
          >
            <FontAwesomeIcon icon={faDiamondTurnRight} aria-hidden="true" />
            View directions
          </Link>
       </section>

       {/* QR Code */}
       <section className="mt-3 rounded-[5px] border border-[#ece7ed] bg-white p-3 text-center shadow-sm">
         <p className=" font-medium uppercase tracking-[0.12em] text-[#5d4b61]">
           Scan to share profile
         </p>

         <div className="mx-auto mt-2 h-[58px] w-[58px] overflow-hidden rounded border border-[#e5e0e7] bg-white p-1">
           <img
            
             alt="QR code to share lecturer profile"
             className="h-full w-full object-contain"
           />
         </div>
       </section>

       {/* Office Hours */}

       {lecturer.officeHours && (
       <section className="mt-3 rounded-[5px] border border-[#ece7ed] bg-white p-3 shadow-sm md:col-span-2">
         <div className="flex items-center justify-between">
           <h2 className=" font-bold text-[#4b145f]">
             Office Hours
           </h2>
           <FontAwesomeIcon icon={faClock} />
         </div>

         <div className="mt-2 divide-y divide-[#eee9ef] ">     
            <div className="flex items-center justify-between py-1.5">
              <span className="font-medium text-[#4c3d50]">
              </span>

              <span className="text-[#695c6c]">
                 {lecturer.officeHours}
               </span>
            </div>
          </div>
        </section>
       )}

    </main>
      );
    }

    export default LecturersInformation;