import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

function LecturerCreate() {
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [researchArea, setResearchArea] = useState('');
  const [email, setEmail] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');
    //fullName, title, department, email, officePhone, researchArea 
    try {
      const response = await fetch('/api/admin/lecturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          title: title || null,
          department: department || null,
          email: email || null,
          officePhone: officePhone||null,
          researchArea: researchArea || null
        }),
      });

      if (!response.ok) {
        throw new Error('Save request failed');
      }

      setSaveMessage('Lecturer added successfully.');
      setFullName('');
      setTitle('');
      setDepartment('');
      setResearchArea('');
      setEmail('');
      setOfficePhone('');
      
    } catch {
      setSaveError('The lecturer could not be added. Please check the details and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (


    // <main className="mx-auto px-24 py-8 max-[640px]:px-12 max-[640px]:pb-28 grid grid-cols-1 gap-4 px-4 pb-6 pt-4 md:grid-cols-3 lg:grid-cols-3">
    <main className="page-shell profile-page">
      <Link className="route-link" to="/lecturers">← Back to lecturers</Link>
      <form onSubmit={handleSave}>
        <section className="rounded-[5px] border border-[color:var(--theme-border)] bg-[var(--theme-surface)] p-4 shadow-sm">
          <h1 className="font-bold text-[color:var(--theme-heading)]">Add lecturer</h1>
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
              <span>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="search-field">
              <span>Office Phone Number</span>
              <input value={officePhone} onChange={(event) => setOfficePhone(event.target.value)} />
            </label>
            <label className="search-field">
              <span>Research area</span>
              <input value={researchArea} onChange={(event) => setResearchArea(event.target.value)} />
            </label>
            
          </div>
          <button className="primary-button mt-4" type="submit" disabled={isSaving}>
            {isSaving ? 'Adding...' : 'Add lecturer'}
          </button>
          {saveMessage && <p className="status-message status-message--success" role="status">{saveMessage}</p>}
          {saveError && <p className="status-message status-message--error" role="alert">{saveError}</p>}
        </section>
      </form>
      

    </main>
      );
    }

    export default LecturerCreate;
