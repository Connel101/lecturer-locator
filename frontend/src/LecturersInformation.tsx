import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faClock,
  faDiamondTurnRight,
  faEnvelope,
  faPhone,

} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLecturerProfile } from './lecturer-profile';
import LecturerQRCode from './LecturerQRCode';

const dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

function telephoneHref(officePhone: string) {
  const trimmedPhone = officePhone.trim();
  const prefix = trimmedPhone.startsWith('+') ? '+' : '';
  return `tel:${prefix}${trimmedPhone.replace(/\D/g, '')}`;
}

function LecturersInformation() {
  const lecturer = useLecturerProfile();
  const photoUrl = lecturer.photoUrl?.trim();
  const researchArea = lecturer.researchArea?.trim();
  const hasContactDetails = Boolean(lecturer.email || lecturer.officePhone);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  return (


    // <main className="mx-auto px-24 py-8 max-[640px]:px-12 max-[640px]:pb-28 grid grid-cols-1 gap-4 px-4 pb-6 pt-4 md:grid-cols-3 lg:grid-cols-3">
    <main className="page-shell profile-page">
      <Link className="route-link" to="/directory">← Back to directory</Link>
      {/* Lecture's Details */}
    <section className="overflow-hidden rounded-[5px] border border-[color:var(--theme-border)] bg-[var(--theme-surface)] shadow-sm md:col-span-1 md:row-span-2">
      <div className="flex flex-col items-center px-4 pb-3 pt-4">

           {/* TODO: Connect profile photos when the API provides photoUrl. */}
           {photoUrl && photoUrl !== failedPhotoUrl && (
             <div className="mb-2 h-[82px] w-[70px] overflow-hidden rounded-[4px] border border-[color:var(--theme-border)] bg-[var(--theme-surface-muted)]">
               <img
                 src={photoUrl}
                 alt={lecturer.fullName}
                 className="h-full w-full object-cover"
                 onError={() => setFailedPhotoUrl(photoUrl)}
               />
             </div>
           )}

           <h1 className="text-center font-bold text-[color:var(--theme-heading)]">
             {lecturer.fullName}
            
           </h1>

           <p className="mt-0.5 text-[color:var(--theme-secondary)]">
             {lecturer.title}, {lecturer.department}
           </p>

           <div className="mt-2 flex flex-wrap justify-center gap-1.5">
             
               {lecturer.modules.map((module) => (
                  <span className="rounded-full border border-[color:var(--theme-border)] bg-[var(--theme-surface-muted)] px-2 py-0.5  font-semibold text-[color:var(--theme-heading)]" key={module.code}>
                    {module.code}
                  </span>
                ))}
             
           </div>
           {researchArea && (
             <div className="mt-3 w-full min-w-0 border-t border-[color:var(--theme-border)] pt-3 text-left">
               <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--theme-muted)]">
                 Research area
               </p>
               <p className="mt-1 break-words text-sm leading-relaxed text-[color:var(--theme-secondary)] [overflow-wrap:anywhere]">
                 {researchArea}
               </p>
             </div>
           )}
         </div>
       </section>

       {/* Contact details */}
       {hasContactDetails && (
         <section className="mt-3 rounded-[5px] border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm">
           <h2 className="mb-2 font-bold text-[color:var(--theme-heading)]">
             Contact
           </h2>

           <div className="grid gap-2">
             {lecturer.email && (
               <a
                 className="flex min-h-14 items-center gap-3 rounded-lg border border-[color:var(--theme-border)] px-3 py-2 text-[color:var(--theme-heading)] no-underline transition-colors hover:bg-[var(--theme-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)] motion-reduce:transition-none"
                 href={`mailto:${lecturer.email}`}
               >
                 <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" />
                 <span className="min-w-0">
                   <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--theme-muted)]">
                     Email
                   </span>
                   <span className="block break-all font-medium">
                     {lecturer.email}
                   </span>
                 </span>
               </a>
             )}

             {lecturer.officePhone && (
               <a
                 className="flex min-h-14 items-center gap-3 rounded-lg border border-[color:var(--theme-border)] px-3 py-2 text-[color:var(--theme-heading)] no-underline transition-colors hover:bg-[var(--theme-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-accent)] motion-reduce:transition-none"
                 href={telephoneHref(lecturer.officePhone)}
               >
                 <FontAwesomeIcon icon={faPhone} aria-hidden="true" />
                 <span className="min-w-0">
                   <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--theme-muted)]">
                     Office phone
                   </span>
                   <span className="block break-words font-medium">
                     {lecturer.officePhone}
                   </span>
                 </span>
               </a>
             )}
           </div>
         </section>
       )}

       {/* Contact & Location */}
       <section className="mt-3 rounded-[5px] border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm">

         <h2 className=" font-bold text-[color:var(--theme-heading)] mb-4">
            Location
         </h2>

           {/* Office */}
          <div className="flex gap-2">
            <FontAwesomeIcon icon={faBuilding} />
          <div>
          <p className="font-semibold text-[color:var(--theme-secondary)]">
            Office
          </p>

          <p className="leading-3 text-[color:var(--theme-secondary)]">
            {lecturer.office ? `${lecturer.office.buildingName ?? 'Building unavailable'}, room ${lecturer.office.roomNumber}` : 'Office not assigned'}
          </p>

          </div>
          </div>

          <Link
            to="directions"
            className="primary-button mt-4 flex min-h-14 w-full items-center justify-center gap-3 text-center no-underline transition-colors hover:bg-[var(--theme-button-hover)] active:bg-[var(--theme-button-active)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-accent)] motion-reduce:transition-none"
          >
            <FontAwesomeIcon icon={faDiamondTurnRight} aria-hidden="true" />
            View directions
          </Link>
       </section>

       <section className="mt-3 rounded-[5px] border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm">
         <h2 className="mb-2 font-bold text-[color:var(--theme-heading)]">Timetable</h2>
         {lecturer.timetableFileRef ? (
           <Link to="timetable" className="primary-button flex min-h-14 items-center justify-center no-underline">View timetable</Link>
         ) : <p className="status-message">No timetable is available.</p>}
       </section>

       {/* QR Code */}
       <section className="mt-3 rounded-[5px] border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-3 text-center shadow-sm">
         <p className=" font-medium uppercase tracking-[0.12em] text-[color:var(--theme-secondary)]">
           Scan to share profile
         </p>

         <div className="mx-auto mt-2 h-[120px] w-[120px] overflow-hidden rounded border border-[color:var(--theme-border)] bg-white p-1">
           <LecturerQRCode lecturerId={lecturer.id} />
         </div>
       </section>

       {/* Office Hours */}

       {lecturer.officeHours.length > 0 && (
       <section className="mt-3 rounded-[5px] border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-3 shadow-sm md:col-span-2">
         <div className="flex items-center justify-between">
           <h2 className=" font-bold text-[color:var(--theme-heading)]">
             Office Hours
           </h2>
           <FontAwesomeIcon icon={faClock} />
         </div>

         <div className="mt-2 divide-y divide-[color:var(--theme-border)] ">
            {lecturer.officeHours.map((officeHour) => (
            <div
              className="flex items-center justify-between py-1.5"
              key={`${officeHour.dayOfWeek}-${officeHour.startTime}-${officeHour.endTime}`}
            >
              <span className="font-medium text-[color:var(--theme-secondary)]">
                {dayNames[officeHour.dayOfWeek - 1]}
              </span>

              <span className="text-[color:var(--theme-muted)]">
                 {officeHour.startTime}–{officeHour.endTime}
               </span>
            </div>
            ))}
          </div>
        </section>
       )}

    </main>
      );
    }

    export default LecturersInformation;
