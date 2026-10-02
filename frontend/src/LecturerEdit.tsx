
import { useEffect,useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useLecturerProfile } from './lecturer-profile';


interface Office {
  id: number;
  roomNumber: string;
  floorPlanId: number;
  buildingName: string;
  floorLevel: number;
  createdAt: string;
  updatedAt: string;
}

interface Module {
  id: number;
  code: string;
  name: string;
}

function LecturerEdit() {
  const [offices, setOffices] = useState<Office[]>([]);
  
  //fullName, title, department, email, officePhone, researchArea
  const lecturer = useLecturerProfile();
  const [officeId, setOfficeId] = useState(lecturer.office?.id);
  
  const [fullName, setFullName] = useState(lecturer.fullName);
  const [title, setTitle] = useState(lecturer.title ?? '');
  const [department, setDepartment] = useState(lecturer.department ?? '');
  const [email, setEmail] = useState(lecturer.email ?? '');
  const [officePhone, setOfficePhone] = useState(lecturer.officePhone ?? '');
  const [researchArea, setResearchArea] = useState(lecturer.researchArea ?? '');
  const [building, setBuilding] = useState(lecturer.office?.buildingName ?? '');
  const [floorlevel, setFloorLevel] = useState(lecturer.office?.floorLevel ?? '');
  const [roomNumber, setRoomNumber] = useState(lecturer.office?.roomNumber ?? '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [editDetails, setEditDetails] =useState(true);
  const [IsSavingOffice,setIsSavingOffice] = useState(false);
  const [saveMessageOffice, setSaveMessageOffice] = useState('');
  const [saveErrorOffice, setSaveErrorOffice] = useState('');
  const [editOffice, setEditOffice] =useState(true);
  const [isAddModuleModalOpen, setIsAddModuleModalOpen] = useState(false);
  const selectedOffice = offices.find((office) => office.id === officeId);
  const [modules, setModules] = useState(lecturer.modules);
  const[moduleList, setModuleList] = useState<Module[]>([]);
  const [moduleId,setModuleId] = useState<number | null>(null);

  useEffect(() => {
  async function loadModules() {
    try {
      const response = await fetch("/api/admin/modules");

      if (!response.ok) {
        throw new Error("Failed to load modules");
      }

      const data: { modules: Module[] } = await response.json();

      setModuleList(data.modules);
    } catch (error) {
      console.error("Failed to load Modules:", error);
    }
  }

  loadModules();
}, []);
  
  useEffect(() => {
  async function loadOffices() {
    try {
      const response = await fetch("/api/admin/offices");

      if (!response.ok) {
        throw new Error("Failed to load offices");
      }

      const data: { offices: Office[] } = await response.json();

      setOffices(data.offices);
    } catch (error) {
      console.error("Failed to load offices:", error);
    }
  }

  loadOffices();
}, []);

  

  async function handleSaveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      const response = await fetch(`/api/admin/lecturers/${lecturer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          title: title || null,
          department: department || null,
          email: email || null,
          officePhone: officePhone || null,
          researchArea: researchArea || null,
          
        }),
      });


      if (!response.ok) {
        throw new Error('Save request failed');
      }

      setSaveMessage('Lecturer details saved successfully.');
      setEditDetails(false);
    } catch {
      setSaveError('The lecturer details could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

   async function AddModule(){
      if (moduleId === null) return;
      const response = await fetch(`/api/admin/lecturers/${lecturer.id}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: moduleId,
          
        }),
      });

      if (!response.ok) {
        console.error("Could not add module");
        return;
      }

      const data: { modules: typeof modules } = await response.json();
      setModules(data.modules);
      setModuleId(null);
      setIsAddModuleModalOpen(false);
  }

  async function handleSaveOffice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingOffice(true);
    setSaveMessageOffice('');
    setSaveErrorOffice('');

    try {
      const response = await fetch(`/api/admin/lecturers/${lecturer.id}/office`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId: officeId,
          
        }),
      });


      if (!response.ok) {
        throw new Error('Save request failed');
      }
      if (selectedOffice) {
        setBuilding(selectedOffice.buildingName);
        setFloorLevel(selectedOffice.floorLevel);
        setRoomNumber(selectedOffice.roomNumber);
      }

      setSaveMessageOffice('Lecturer details saved successfully.');
      setEditOffice(false);
    } catch {
      setSaveErrorOffice('The lecturer details could not be saved. Please try again.');
    } finally {
      setIsSavingOffice(false);
    }
  }

  async function removeModule(moduleId: number) {
  
    

    
      const response = await fetch(`/api/admin/lecturers/${lecturer.id}/modules/${moduleId}`, {
        method: 'DELETE',
        
      });

      if (!response.ok) return;

      setModules((current) =>
        current.filter((module) => module.id !== moduleId),
      );
     

     
  }


  return (


    // <main className="mx-auto px-24 py-8 max-[640px]:px-12 max-[640px]:pb-28 grid grid-cols-1 gap-4 px-4 pb-6 pt-4 md:grid-cols-3 lg:grid-cols-3">
    <main className="page-shell profile-page">
      <Link className="route-link" to="/lecturers">← Back to lecturers</Link>
      <form onSubmit={handleSaveDetails}>
        <section className="rounded-[5px] border border-[#ece7ed] bg-white p-4 shadow-sm">
          <h1 className="font-bold text-[#4b145f]">Edit lecturer</h1>
          <div className="mt-4 grid gap-3">
            <label className="search-field">
              <span>Full name</span>
              {editDetails ? (
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
              ) : (
                <p className="m-0 text-xs font-normal leading-tight">{fullName}</p>
              )}
            </label>
            <label className="search-field">
              <span>Title</span>
              {editDetails ? (
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
              ): (
                <p className="m-0 text-xs font-normal leading-tight">{title}</p>
              )}
            </label>
            <label className="search-field">
              <span>Department</span>
              {editDetails ? (
              <input value={department} onChange={(event) => setDepartment(event.target.value)} />
              ):(
                <p className="m-0 text-xs font-normal leading-tight">{department}</p>
              )}
            </label>
            <label className="search-field">
              <span>Email</span>
              {editDetails ? (
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
              ):(<p className="m-0 text-xs font-normal leading-tight">{email}</p>)}
              </label>
            <label className="search-field">
              <span>Office Phone Number</span>
              {editDetails ? (
              <input value={officePhone} onChange={(event) => setOfficePhone(event.target.value)} />
              ):(<p className="m-0 text-xs font-normal leading-tight">{officePhone}</p>)}
              </label>
            <label className="search-field">
              <span>Research area</span>
              {editDetails ? (
              <input value={researchArea} onChange={(event) => setResearchArea(event.target.value)} />
              ):(<p className="m-0 text-xs font-normal leading-tight">{researchArea}</p>)}
            </label>
          </div>
          {saveMessage && !editDetails&& <p className="status-message status-message--success" role="status">{saveMessage}</p>}
          {saveError && !editDetails&& <p className="status-message status-message--error" role="alert">{saveError}</p>}
        
          <div className="mt-4 flex justify-end">
            {editDetails ? (
              <button className="primary-button" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            ) : (
              <button
                className="primary-button"
                type="button"
                onClick={(event) => { event.preventDefault(); setEditDetails(true); }}
              >
                Edit
              </button>
            )}
          </div>
          </section>
      </form>

      <form onSubmit={handleSaveOffice}>
        <section className="mt-4 rounded-[5px] border border-[#ece7ed] bg-white p-4 shadow-sm">
          <div className="mt-4 grid gap-3">
            <label className="search-field">
              <span>Building</span>
              {!editOffice && (
                <p className="m-0 text-xs font-normal leading-tight">{building}</p>
              )}
              {editOffice && (
                <select>
                  <option value="building">{"G3"}</option>
                </select>
                )}
            </label>
            <label className="search-field">
              <span>Floorlevel</span>
              {!editOffice && (
                <p className="m-0 text-xs font-normal leading-tight">{floorlevel}</p>
              )}
              {editOffice && (
                <select>
                  <option value="floorlevel">{"1"}</option>
                </select>
                )}
            </label>
            <label className="search-field">
              <span>Room Number</span>
              {!editOffice && (
                <p className="m-0 text-xs font-normal leading-tight">{roomNumber}</p>
              )}
              {editOffice && (
                <select
                  value={officeId ?? ""}
                  onChange={(e) => {
                  setOfficeId(e.target.value ? Number(e.target.value) : null);
                  }}
                >
                <option value="">Select an office</option>

                {offices.map((office) => (
                <option key={office.id} value={office.id}>
                {office.buildingName} - Floor {office.floorLevel} - Room{" "}
                {office.roomNumber}
                </option>
                 ))}
                </select>
                )}
            </label>
            
            
            
            
            
          </div>
          {saveMessageOffice && !editOffice&& <p className="status-message status-message--success" role="status">{saveMessageOffice}</p>}
          {saveErrorOffice && !editOffice&& <p className="status-message status-message--error" role="alert">{saveErrorOffice}</p>}
        
          <div className="mt-4 flex justify-end">

            {editOffice ? (
              <button className="primary-button" type="submit" disabled={isSaving}>
                {IsSavingOffice ? 'Saving...' : 'Save'}
              </button>
            ) : (
              <button
                className="primary-button"
                type="button"
                onClick={(event) => { event.preventDefault(); setEditOffice(true); }}
              >
                Edit
              </button>
            )}
          </div>
          </section>
      </form>

      
        <section className="mt-4 rounded-[5px] border border-[#ece7ed] bg-white p-4 shadow-sm">
          <div className="mt-4 grid gap-3">
            <label className="search-field">
              <span>Modules</span>
              <div className="mt-2 flex flex-wrap  gap-1.5">
             
               {modules.map((module) => (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#e2d2e7] bg-[#f7f0f9] px-2 py-0.5 font-semibold text-[#5a1b70]" key={module.code}>
                    {module.code}
                    <button
                      aria-label="Decorative cross"
                      className="inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-[#5a1b70]"
                      type="button"
                      onClick={() => void removeModule(module.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
             
           </div>
            </label>
              
            
            
            
            
            
            
          </div>
          {saveMessageOffice && !editOffice&& <p className="status-message status-message--success" role="status">{saveMessageOffice}</p>}
          {saveErrorOffice && !editOffice&& <p className="status-message status-message--error" role="alert">{saveErrorOffice}</p>}
        
          <div className="mt-4 flex justify-end">
            
              
              <button
                className="primary-button"
                type="button"
                onClick={() => setIsAddModuleModalOpen(true)}
              >
                Add module
              </button>
        
          </div>
          </section>

      {isAddModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#261632]/50 p-4">
          <section
            aria-labelledby="add-module-title"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-[#ece7ed] bg-white p-6 shadow-xl"
            role="dialog"
          >
            <h2 className="text-xl font-bold text-[#4b145f]" id="add-module-title">
              Add module
            </h2>
            <label className="search-field mt-4">
              <span>Module code</span>
              
              <select
                  value={moduleId ?? ""}
                  onChange={(e) => {
                  setModuleId(e.target.value ? Number(e.target.value) : null);
                  }}
                >
                <option value="">Select an office</option>

                {moduleList.map((module) => (
                <option key={module.id} value={module.id}>
                {module.code}
                </option>
                 ))}
                </select>
                
            
              </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-[#d9cfde] px-4 py-2 font-semibold text-[#4d3a57] hover:bg-[#f7f4f9]"
                onClick={() => setIsAddModuleModalOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-button" type="button" onClick={() => AddModule()}>
                Add
              </button>
            </div>
          </section>
        </div>
      )}

    </main>
      );
    }

    export default LecturerEdit;
