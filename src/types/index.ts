// Tipos TypeScript para MedAgenda

export type AppointmentStatus =
  | 'AGENDADA'
  | 'CONFIRMADA'
  | 'REALIZADA'
  | 'CANCELADA'
  | 'NAO_COMPARECEU';

export type Gender = 'MASCULINO' | 'FEMININO' | 'OUTRO';

export interface Specialty {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  crm: string;
  specialtyId: string;
  phone: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorWithSpecialty extends Doctor {
  specialty?: Specialty;
  appointmentsCount?: number;
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string; // ISO string or YYYY-MM-DD
  gender: Gender;
  phone: string;
  email: string;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientWithStats extends Patient {
  appointmentsCount?: number;
  lastAppointmentDate?: string | null;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // minutes
  reason: string;
  notes?: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentWithDetails extends Appointment {
  patient?: Patient;
  doctor?: DoctorWithSpecialty;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  activeDoctors: number;
  appointmentsToday: number;
  appointmentsThisWeek: number;
  appointmentsPending: number;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  upcomingAppointments: AppointmentWithDetails[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  errors?: Record<string, string[]>;
}
