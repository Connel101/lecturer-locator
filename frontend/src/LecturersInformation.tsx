import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faClock,
  faEnvelope,
  faLocationDot,
  faPhone,
  faDiamondTurnRight,

} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Module = {
  code: string;
};

type Lecturer = {
  id: string;
  fullName: string;
  title: string;
  department: string;
  modules: Module[];
  researchArea: string;
  officeHours: string;
  office: {
    buildingName: string;
    floorLevel: number;
    roomNumber: string;
  };
  route:{
    floorPlan:{
      buldingName: string;
      floorLevel: number;
      fileRef: string; 
    },
    entrancePoint:string;
  }
};

function LecturersInformation() {
  const { id } = useParams();
  const [lecturer, setLecturer] = useState<Lecturer | null>(null);

  useEffect(() => {
    
    const fetchLecturer = async () => {
      try {
        const response = await fetch(
          `/api/lecturers/${id}`
        );

        if (!response.ok) {
          throw new Error("Lecturer not found");
        }

        const data = await response.json();
        setLecturer(data);
      } catch (error) {
        console.error(error);
      }
    };

    if (id) {
      fetchLecturer();
    }
  }, [id]);

  if (!lecturer) {
    return <p>Loading...</p>;
  }
  return (


    // <main className="mx-auto px-24 py-8 max-[640px]:px-12 max-[640px]:pb-28 grid grid-cols-1 gap-4 px-4 pb-6 pt-4 md:grid-cols-3 lg:grid-cols-3">
    <main className="page-shell">
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
            {lecturer.office.buildingName}, room {lecturer.office.roomNumber}
          </p>

          <div className="flex gap-2">
          <button className="cursor-pointer mt-1 inline-flex items-center gap-1 font-semibold text-[#4b145f] hover:underline">
          <FontAwesomeIcon icon={faLocationDot} />
            View Map
          </button>
          <button className="cursor-pointer mt-1 inline-flex items-center gap-1 font-semibold text-[#4b145f] hover:underline">
            <FontAwesomeIcon icon={faDiamondTurnRight} />
              View directions
          </button>
          </div>
          </div>
          </div> 
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