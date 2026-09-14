import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faClock,
  faEnvelope,
  faLocationDot,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Lecturer = {
  id: string;
  fullName: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  office: {
    buildingName: string;
    floorLevel: number;
    roomNumber: string;
  };
};

function LecturersInformation() {
  //  const lecturers = [
  //   {
  //     name: "Dr. Jane Doe",
  //     title: "Senior Lecturer",
  //     department: "Computer Science",
  //     email: "jane.doe@university.edu",
  //     phone: "+27 18 123 4567",
  //     office: "Building CS, Room 120",
  //     appointmentNote: "By appointment only",
  //     hours: [
  //       {
  //         day: "Monday",
  //         time: "09:00 - 11:00",
  //       },
  //     ],
  //     AcademicFocus:"Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of  (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem IpsumLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
  //   },
    
  // ];
  const { id } = useParams();
  const [lecturer, setLecturer] = useState<Lecturer | null>(null);

  useEffect(() => {
    const fetchLecturer = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/lecturers/${id}`
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
    <>
    <div>{lecturer.fullName}</div>
    </>

    // <main className="mx-auto px-24 py-8 max-[640px]:px-12 max-[640px]:pb-28 grid grid-cols-1 gap-4 px-4 pb-6 pt-4 md:grid-cols-3 lg:grid-cols-3">
    // <section className="overflow-hidden rounded-[5px] border border-[#ece7ed] bg-white shadow-sm md:col-span-1 md:row-span-2">
    //     <div className="flex flex-col items-center px-4 pb-3 pt-4">

    //       <div className="h-[82px] w-[70px] overflow-hidden rounded-[4px] border border-[#e2dce4] bg-[#eee9ef]">
    //         <img
              
    //           alt={lecturer.fullName || "Lecturer"}
    //           className="h-full w-full object-cover"
    //         />
    //       </div>

    //       <h1 className="mt-2 font-bold text-[#4b145f]">
    //         {lecturer.fullName}
            
    //       </h1>

    //       <p className="mt-0.5 text-[#4d3b51]">
    //         {lecturer.title}, {lecturer.department}
    //       </p>

    //       <div className="mt-2 flex flex-wrap justify-center gap-1.5">
    //         <span className="rounded-full border border-[#e2d2e7] bg-[#f7f0f9] px-2 py-0.5  font-semibold text-[#5a1b70]">
    //           Ph.D. Computer Science
    //         </span>

    //         <span className="rounded-full border border-[#e2d2e7] bg-[#f7f0f9] px-2 py-0.5  font-semibold text-[#5a1b70]">
    //           AI Research
    //         </span>
    //       </div>
    //     </div>
    //   </section>

    //   {/* Contact & Location */}
    //   <section className="mt-3 rounded-[5px] border border-[#ece7ed] bg-white p-3 shadow-sm">

    //     <h2 className=" font-bold text-[#4b145f]">
    //       Contact &amp; Location
    //     </h2>

    //     <div className="mt-2 space-y-2 ">

    //       {/* Email */}
    //       <div className="flex gap-2">
    //         <FontAwesomeIcon icon={faEnvelope} />

    //         <div className="min-w-0">
    //           <p className="font-semibold text-[#4a3a4e]">
    //             Email
    //           </p>

    //           <a
    //             href={`mailto:${lecturers[0].email}`}
    //             className="break-all text-[#4b145f] hover:underline"
    //           >
    //             {lecturers[0].email}
    //           </a>
    //         </div>
    //       </div>

    //       {/* Phone */}
    //       <div className="flex gap-2">
    //         <FontAwesomeIcon icon={faPhone} />

    //         <div>
    //           <p className="font-semibold text-[#4a3a4e]">
    //             Phone
    //           </p>

    //           <a
    //             href={`tel:${lecturers[0].phone}`}
    //             className="text-[#4b145f] hover:underline"
    //           >
    //             {lecturers[0].phone}
    //           </a>
    //         </div>
    //       </div>

    //       {/* Office */}
    //       <div className="flex gap-2">
    //         <FontAwesomeIcon icon={faBuilding} />

    //         <div>
    //           <p className="font-semibold text-[#4a3a4e]">
    //             Office
    //           </p>

    //           <p className="leading-3 text-[#56465a]">
    //             {lecturers[0].office}
    //           </p>

    //           <div className="flex gap-2">
    //           <button className="mt-1 inline-flex items-center gap-1 font-semibold text-[#4b145f] hover:underline">
    //             <FontAwesomeIcon icon={faLocationDot} />
    //             View Map
    //           </button>
    //           <button className="mt-1 inline-flex items-center gap-1 font-semibold text-[#4b145f] hover:underline">
    //             <FontAwesomeIcon icon={faLocationDot} />
    //             View directions
    //           </button>
    //           </div>

    //         </div>
    //       </div>

    //     </div>
    //   </section>

    //   {/* QR Code */}
    //   <section className="mt-3 rounded-[5px] border border-[#ece7ed] bg-white p-3 text-center shadow-sm">

    //     <p className=" font-medium uppercase tracking-[0.12em] text-[#5d4b61]">
    //       Scan to share profile
    //     </p>

    //     <div className="mx-auto mt-2 h-[58px] w-[58px] overflow-hidden rounded border border-[#e5e0e7] bg-white p-1">
    //       <img
            
    //         alt="QR code to share lecturer profile"
    //         className="h-full w-full object-contain"
    //       />
    //     </div>

    //   </section>

    //   {/* Office Hours */}
    //   <section className="mt-3 rounded-[5px] border border-[#ece7ed] bg-white p-3 shadow-sm md:col-span-2">
    //     <div className="flex items-center justify-between">
    //       <h2 className=" font-bold text-[#4b145f]">
    //         Office Hours
    //       </h2>

    //       <FontAwesomeIcon icon={faClock} />
    //     </div>

    //     <div className="mt-2 divide-y divide-[#eee9ef] ">

    //       {lecturers[0].hours.map((item) => (
    //         <div
    //           key={item.day}
    //           className="flex items-center justify-between py-1.5"
    //         >
    //           <span className="font-medium text-[#4c3d50]">
    //             {item.day}
    //           </span>

    //           <span className="text-[#695c6c]">
    //             {item.time}
    //           </span>
    //         </div>
    //       ))}

    //       {lecturers[0].appointmentNote && (
    //         <div className="flex items-center justify-between py-1.5">
    //           <span className="font-medium text-[#4c3d50]">
    //             Thursday
    //           </span>

    //           <span className="text-[#695c6c]">
    //             {lecturers[0].appointmentNote}
    //           </span>
    //         </div>
    //       )}

    //     </div>

    //     <button
    //       type="button"
    //       className="mt-2 w-full rounded-[3px] bg-[#4b145f] py-2 text-[8px] font-bold text-white transition hover:bg-[#3c104c] focus:outline-none focus:ring-2 focus:ring-[#b993c2] focus:ring-offset-2"
    //     >
    //       Request Appointment
    //     </button>

    //   </section>

    //   {/* Academic Focus */}
    //   <section className="mt-3 rounded-[5px] border border-[#ece7ed] bg-white p-3 shadow-sm md:col-span-3">
    //     <div className="flex items-center justify-between">
    //       <h2 className=" font-bold text-[#4b145f]">
    //         Academic Focus
    //       </h2>
    //     </div>

    //     <div className="mt-2 divide-y divide-[#eee9ef] ">

    //       <p className="text-[#695c6c]">
    //         {lecturers[0].AcademicFocus}
    //       </p>
    //     </div>

        

    //   </section>

    // </main>
      );
    }

    export default LecturersInformation;