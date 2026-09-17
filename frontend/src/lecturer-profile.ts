import { useOutletContext } from 'react-router-dom'

export interface LecturerProfile {
  id: string
  fullName: string
  // Optional until profile photos are supplied by the API.
  photoUrl?: string | null
  title: string | null
  department: string | null
  modules: { code: string; name?: string }[]
  researchArea?: string
  officeHours: { dayOfWeek: number; startTime: string; endTime: string }[]
  office: { buildingName: string | null; floorLevel: number | null; roomNumber: string } | null
  route: {
    floorPlan: { buildingName: string; floorLevel: number; fileRef: string }
    entrancePoint: string
    svgOverlay: string | null
  } | null
}

export function useLecturerProfile() {
  return useOutletContext<LecturerProfile>()
}
