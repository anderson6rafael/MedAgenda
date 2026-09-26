// Cliente de API conectado diretamente ao Firebase Firestore (Banco de dados nativo do AI Studio)
import {
  firestoreService,
  seedFirestoreIfEmpty,
  resetFirestoreDatabase,
  testFirestoreConnection,
} from './firebase.ts';
import {
  appointmentService,
  dashboardService,
  doctorService,
  patientService,
  resetDatabaseToSeed,
  specialtyService,
} from './database.ts';
import {
  Appointment,
  AppointmentWithDetails,
  DashboardStats,
  Doctor,
  DoctorWithSpecialty,
  Patient,
  PatientWithStats,
  Specialty,
} from '../types/index.ts';

// Executa operação no Firestore com fallback automático
async function tryFirestore<T>(
  firestoreFn: () => Promise<T>,
  fallbackFn: () => T
): Promise<T> {
  try {
    return await firestoreFn();
  } catch (err: any) {
    console.warn('Operação Firestore falhou, usando fallback local:', err);
    return fallbackFn();
  }
}

export const api = {
  // Inicialização e verificação de conexão
  async init(): Promise<void> {
    await testFirestoreConnection();
    await seedFirestoreIfEmpty();
  },

  // Reset de dados no Firestore e LocalStorage
  async resetSeed(): Promise<void> {
    try {
      await resetFirestoreDatabase();
    } catch (e) {
      console.warn('Erro ao resetar Firestore:', e);
    }
    resetDatabaseToSeed();
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return tryFirestore(
      () => firestoreService.dashboard.getStats(),
      () => dashboardService.getStats()
    );
  },

  // Especialidades
  specialties: {
    async list(): Promise<Specialty[]> {
      return tryFirestore(
        () => firestoreService.specialties.list(),
        () => specialtyService.list()
      );
    },
    async getById(id: string): Promise<Specialty | null> {
      return tryFirestore(
        () => firestoreService.specialties.getById(id),
        () => specialtyService.getById(id)
      );
    },
    async create(data: unknown): Promise<Specialty> {
      return tryFirestore(
        () => firestoreService.specialties.create(data),
        () => specialtyService.create(data)
      );
    },
    async update(id: string, data: unknown): Promise<Specialty> {
      return tryFirestore(
        () => firestoreService.specialties.update(id, data),
        () => specialtyService.update(id, data)
      );
    },
    async delete(id: string): Promise<void> {
      return tryFirestore(
        () => firestoreService.specialties.delete(id),
        () => specialtyService.delete(id)
      );
    },
  },

  // Médicos
  doctors: {
    async list(filters?: { search?: string; specialtyId?: string; active?: boolean }): Promise<DoctorWithSpecialty[]> {
      return tryFirestore(
        () => firestoreService.doctors.list(filters),
        () => doctorService.list(filters)
      );
    },
    async getById(id: string): Promise<DoctorWithSpecialty | null> {
      return tryFirestore(
        () => firestoreService.doctors.getById(id),
        () => doctorService.getById(id)
      );
    },
    async create(data: unknown): Promise<Doctor> {
      return tryFirestore(
        () => firestoreService.doctors.create(data),
        () => doctorService.create(data)
      );
    },
    async update(id: string, data: unknown): Promise<Doctor> {
      return tryFirestore(
        () => firestoreService.doctors.update(id, data),
        () => doctorService.update(id, data)
      );
    },
    async toggleActive(id: string): Promise<Doctor> {
      return tryFirestore(
        () => firestoreService.doctors.toggleActive(id),
        () => doctorService.toggleActive(id)
      );
    },
    async delete(id: string): Promise<void> {
      return tryFirestore(
        () => firestoreService.doctors.delete(id),
        () => doctorService.delete(id)
      );
    },
  },

  // Pacientes
  patients: {
    async list(filters?: { search?: string }): Promise<PatientWithStats[]> {
      return tryFirestore(
        () => firestoreService.patients.list(filters),
        () => patientService.list(filters)
      );
    },
    async getById(id: string): Promise<(PatientWithStats & { appointments: AppointmentWithDetails[] }) | null> {
      return tryFirestore(
        () => firestoreService.patients.getById(id),
        () => patientService.getById(id)
      );
    },
    async create(data: unknown): Promise<Patient> {
      return tryFirestore(
        () => firestoreService.patients.create(data),
        () => patientService.create(data)
      );
    },
    async update(id: string, data: unknown): Promise<Patient> {
      return tryFirestore(
        () => firestoreService.patients.update(id, data),
        () => patientService.update(id, data)
      );
    },
    async delete(id: string): Promise<void> {
      return tryFirestore(
        () => firestoreService.patients.delete(id),
        () => patientService.delete(id)
      );
    },
  },

  // Consultas
  appointments: {
    async list(filters?: {
      date?: string;
      doctorId?: string;
      patientId?: string;
      specialtyId?: string;
      status?: string;
      search?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<AppointmentWithDetails[]> {
      return tryFirestore(
        () => firestoreService.appointments.list(filters),
        () => appointmentService.list(filters)
      );
    },
    async getById(id: string): Promise<AppointmentWithDetails | null> {
      return tryFirestore(
        () => firestoreService.appointments.getById(id),
        () => appointmentService.getById(id)
      );
    },
    async create(data: unknown): Promise<Appointment> {
      return tryFirestore(
        () => firestoreService.appointments.create(data),
        () => appointmentService.create(data)
      );
    },
    async update(id: string, data: unknown): Promise<Appointment> {
      return tryFirestore(
        () => firestoreService.appointments.update(id, data),
        () => appointmentService.update(id, data)
      );
    },
    async updateStatus(id: string, status: Appointment['status']): Promise<Appointment> {
      return tryFirestore(
        () => firestoreService.appointments.updateStatus(id, status),
        () => appointmentService.updateStatus(id, status)
      );
    },
    async cancel(id: string, reasonNote?: string): Promise<Appointment> {
      return tryFirestore(
        () => firestoreService.appointments.cancel(id, reasonNote),
        () => appointmentService.cancel(id, reasonNote)
      );
    },
    async delete(id: string): Promise<void> {
      return tryFirestore(
        () => firestoreService.appointments.delete(id),
        () => appointmentService.delete(id)
      );
    },
  },
};
