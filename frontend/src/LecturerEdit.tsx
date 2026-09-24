import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faClock,
  faDiamondTurnRight,

} from "@fortawesome/free-solid-svg-icons";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLecturerProfile } from './lecturer-profile';

const dayNames = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

function LecturerEdit() {
  const lecturer = useLecturerProfile();
  const photoUrl = lecturer.photoUrl?.trim();
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState(lecturer.fullName);
  const [title, setTitle] = useState(lecturer.title ?? '');
  const [department, setDepartment] = useState(lecturer.department ?? '');
  const [researchArea, setResearchArea] = useState(lecturer.researchArea ?? '');
  const [buildingName, setBuildingName] = useState(lecturer.office?.buildingName ?? '');
  const [roomNumber, setRoomNumber] = useState(lecturer.office?.roomNumber ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const response = await fetch(`/api/admin/lecturers/${lecturer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          title: title || null,
          department: department || null,
          researchArea: researchArea || null,
          buildingName: buildingName || null,
          roomNumber: roomNumber || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Save request failed');
      }

      setSaveMessage('Lecturer details saved successfully.');
    } catch {
      setSaveError('The lecturer details could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (


    // <main className="mx-auto px-24 py-8 max-[640px]:px-12 max-[640px]:pb-28 grid grid-cols-1 gap-4 px-4 pb-6 pt-4 md:grid-cols-3 lg:grid-cols-3">
    <main className="page-shell profile-page">
      <Link className="route-link" to="/lecturers">← Back to lecturers</Link>
      <form onSubmit={handleSave}>
        <section className="rounded-[5px] border border-[#ece7ed] bg-white p-4 shadow-sm">
          <h1 className="font-bold text-[#4b145f]">Edit lecturer</h1>
          <div className="mt-4 grid gap-3">
            <label className="search-field">
              <span>Full name</span>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>
            <label className="search-field">
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="search-field">
              <span>Department</span>
              <input value={department} onChange={(event) => setDepartment(event.target.value)} />
            </label>
            <label className="search-field">
              <span>Research area</span>
              <input value={researchArea} onChange={(event) => setResearchArea(event.target.value)} />
            </label>
            <label className="search-field">
              <span>Building</span>
              <input value={buildingName} onChange={(event) => setBuildingName(event.target.value)} />
            </label>
            <label className="search-field">
              <span>Office</span>
              <input value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} />
            </label>
          </div>
          <button className="primary-button mt-4" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
          {saveMessage && <p className="status-message status-message--success" role="status">{saveMessage}</p>}
          {saveError && <p className="status-message status-message--error" role="alert">{saveError}</p>}
        </section>
      </form>
      

    </main>
      );
    }

    export default LecturerEdit;
