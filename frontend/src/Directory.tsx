function Directory() {
  return (
    <main className="page-shell">
      <p className="eyebrow">Campus directory</p>
      <h1>Find your lecturer</h1>
      <p className="page-intro">Search the directory or scan their QR code to get directions to their office.</p>
      <label className="search-field">
        <span>Lecturer name</span>
        <input type="search" placeholder="e.g. Dr N. Dlamini" />
      </label>
    </main>
  )
}

export default Directory
