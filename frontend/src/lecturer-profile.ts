import { useOutletContext } from 'react-router-dom'

export interface LecturerProfile {
  id: string
  fullName: string
  photoUrl?: string | null
  title: string | null
  department: string | null
  email?: string
  officePhone?: string
  modules: { id:number,code: string; name?: string }[]
  researchArea?: string
  timetableFileRef?: string
  officeHours: { dayOfWeek: number; startTime: string; endTime: string }[]
  office: { id:number | null,buildingName: string | null; floorLevel: number | null; roomNumber: string } | null
  route: {
    floorPlan: { buildingName: string; floorLevel: number; fileRef: string }
    entrancePoint: string
    svgOverlay: string | null
  } | null
}

export function useLecturerProfile() {
  return useOutletContext<LecturerProfile & { setPhotoUrl: (photoUrl: string) => void }>()
}
