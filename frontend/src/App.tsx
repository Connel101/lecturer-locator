import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <h1 className="text-5xl font-bold text-blue-600">
        Lecture Locator
      </h1>
    </div>

    </>
  )
}

export default App
