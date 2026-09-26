// Inicialização do Firebase Firestore (Banco de dados nativo do AI Studio)
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
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
import {
  initialDoctors,
  initialPatients,
  initialSpecialties,
  getInitialAppointments,
} from '../../prisma/seed.ts';
import {
  appointmentSchema,
  doctorSchema,
  patientSchema,
  specialtySchema,
} from '../schemas/index.ts';

// Inicializa Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: Deve passar firebaseConfig.firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString(),
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(errInfo.error);
}

// Testa conectividade com Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline:', error.message);
      return false;
    }
    return true;
  }
}

// ==========================================
// SEED NO FIRESTORE
// ==========================================
export async function seedFirestoreIfEmpty(): Promise<void> {
  try {
    const specsSnap = await getDocs(collection(db, 'specialties'));
    if (!specsSnap.empty) {
      return; // Já populado
    }

    console.log('Populando Firestore com dados iniciais do AI Studio...');
    const now = new Date().toISOString();

    // 1. Especialidades
    for (const spec of initialSpecialties) {
      await setDoc(doc(db, 'specialties', spec.id), {
        ...spec,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 2. Médicos
    for (const docItem of initialDoctors) {
      await setDoc(doc(db, 'doctors', docItem.id), {
        ...docItem,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 3. Pacientes
    for (const pat of initialPatients) {
      await setDoc(doc(db, 'patients', pat.id), {
        ...pat,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 4. Consultas
    for (const apt of getInitialAppointments()) {
      await setDoc(doc(db, 'appointments', apt.id), {
        ...apt,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log('Firestore populado com sucesso!');
  } catch (err) {
    console.error('Erro ao verificar/popular seed no Firestore:', err);
  }
}

// Força reset completo no Firestore
export async function resetFirestoreDatabase(): Promise<void> {
  const now = new Date().toISOString();

  // Especialidades
  for (const s of initialSpecialties) {
    await setDoc(doc(db, 'specialties', s.id), { ...s, createdAt: now, updatedAt: now });
  }

  // Médicos
  for (const d of initialDoctors) {
    await setDoc(doc(db, 'doctors', d.id), { ...d, createdAt: now, updatedAt: now });
  }

  // Pacientes
  for (const p of initialPatients) {
    await setDoc(doc(db, 'patients', p.id), { ...p, createdAt: now, updatedAt: now });
  }

  // Consultas
  for (const a of getInitialAppointments()) {
    await setDoc(doc(db, 'appointments', a.id), { ...a, createdAt: now, updatedAt: now });
  }
}

// ==========================================
// FIRESTORE SERVICES COM REGRAS DE NEGÓCIO
// ==========================================

export const firestoreService = {
  // 1. Especialidades
  specialties: {
    async list(): Promise<Specialty[]> {
      try {
        const snap = await getDocs(collection(db, 'specialties'));
        const list: Specialty[] = [];
        snap.forEach((d) => list.push(d.data() as Specialty));
        return list.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'specialties');
      }
    },

    async getById(id: string): Promise<Specialty | null> {
      try {
        const snap = await getDoc(doc(db, 'specialties', id));
        return snap.exists() ? (snap.data() as Specialty) : null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `specialties/${id}`);
      }
    },

    async create(data: unknown): Promise<Specialty> {
      const parsed = specialtySchema.parse(data);
      const list = await this.list();

      // Constraint de nome único
      if (list.some((s) => s.name.toLowerCase() === parsed.name.toLowerCase())) {
        throw new Error('Já existe uma especialidade com este nome no banco de dados.');
      }

      const id = `spec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const newSpec: Specialty = {
        id,
        name: parsed.name,
        description: parsed.description || null,
        active: parsed.active ?? true,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(doc(db, 'specialties', id), newSpec);
        return newSpec;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `specialties/${id}`);
      }
    },

    async update(id: string, data: unknown): Promise<Specialty> {
      const parsed = specialtySchema.partial().parse(data);
      const current = await this.getById(id);
      if (!current) throw new Error('Especialidade não encontrada.');

      if (parsed.name) {
        const list = await this.list();
        if (list.some((s) => s.id !== id && s.name.toLowerCase() === parsed.name!.toLowerCase())) {
          throw new Error('Já existe outra especialidade cadastrada com este nome.');
        }
      }

      const updated: Specialty = {
        ...current,
        ...parsed,
        updatedAt: new Date().toISOString(),
      };

      try {
        await updateDoc(doc(db, 'specialties', id), updated as any);
        return updated;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `specialties/${id}`);
      }
    },

    async delete(id: string): Promise<void> {
      const doctors = await firestoreService.doctors.list();
      if (doctors.some((d) => d.specialtyId === id)) {
        throw new Error('Não é possível excluir esta especialidade pois existem médicos vinculados a ela.');
      }
      try {
        await deleteDoc(doc(db, 'specialties', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `specialties/${id}`);
      }
    },
  },

  // 2. Médicos
  doctors: {
    async list(filters?: { search?: string; specialtyId?: string; active?: boolean }): Promise<DoctorWithSpecialty[]> {
      try {
        const snap = await getDocs(collection(db, 'doctors'));
        const doctors: Doctor[] = [];
        snap.forEach((d) => doctors.push(d.data() as Doctor));

        const specialties = await firestoreService.specialties.list();
        const appointmentsSnap = await getDocs(collection(db, 'appointments'));
        const appointments: Appointment[] = [];
        appointmentsSnap.forEach((a) => appointments.push(a.data() as Appointment));

        let result: DoctorWithSpecialty[] = doctors.map((docItem) => {
          const spec = specialties.find((s) => s.id === docItem.specialtyId);
          const apts = appointments.filter((a) => a.doctorId === docItem.id);
          return {
            ...docItem,
            specialty: spec,
            appointmentsCount: apts.length,
          };
        });

        if (filters?.search) {
          const term = filters.search.toLowerCase();
          result = result.filter(
            (d) =>
              d.name.toLowerCase().includes(term) ||
              d.crm.toLowerCase().includes(term) ||
              d.email.toLowerCase().includes(term)
          );
        }

        if (filters?.specialtyId && filters.specialtyId !== 'all') {
          result = result.filter((d) => d.specialtyId === filters.specialtyId);
        }

        if (filters?.active !== undefined) {
          result = result.filter((d) => d.active === filters.active);
        }

        return result.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'doctors');
      }
    },

    async getById(id: string): Promise<DoctorWithSpecialty | null> {
      try {
        const snap = await getDoc(doc(db, 'doctors', id));
        if (!snap.exists()) return null;
        const data = snap.data() as Doctor;
        const spec = await firestoreService.specialties.getById(data.specialtyId);
        return { ...data, specialty: spec || undefined };
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `doctors/${id}`);
      }
    },

    async create(data: unknown): Promise<Doctor> {
      const parsed = doctorSchema.parse(data);
      const list = await this.list();

      // Constraint: CRM único
      const cleanCRM = parsed.crm.toUpperCase().trim();
      if (list.some((d) => d.crm.toUpperCase().trim() === cleanCRM)) {
        throw new Error('Já existe um médico cadastrado no banco com este CRM.');
      }

      const id = `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const newDoc: Doctor = {
        id,
        name: parsed.name,
        crm: parsed.crm,
        specialtyId: parsed.specialtyId,
        phone: parsed.phone,
        email: parsed.email,
        active: parsed.active ?? true,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(doc(db, 'doctors', id), newDoc);
        return newDoc;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `doctors/${id}`);
      }
    },

    async update(id: string, data: unknown): Promise<Doctor> {
      const parsed = doctorSchema.partial().parse(data);
      const current = await this.getById(id);
      if (!current) throw new Error('Médico não encontrado.');

      if (parsed.crm) {
        const cleanCRM = parsed.crm.toUpperCase().trim();
        const list = await this.list();
        if (list.some((d) => d.id !== id && d.crm.toUpperCase().trim() === cleanCRM)) {
          throw new Error('Já existe outro médico com este CRM.');
        }
      }

      const updated: Doctor = {
        ...current,
        ...parsed,
        updatedAt: new Date().toISOString(),
      };

      try {
        await updateDoc(doc(db, 'doctors', id), updated as any);
        return updated;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `doctors/${id}`);
      }
    },

    async toggleActive(id: string): Promise<Doctor> {
      const docItem = await this.getById(id);
      if (!docItem) throw new Error('Médico não encontrado.');
      return this.update(id, { active: !docItem.active });
    },

    async delete(id: string): Promise<void> {
      const apts = await firestoreService.appointments.list({ doctorId: id });
      if (apts.length > 0) {
        throw new Error('Não é possível excluir este médico pois existem consultas registradas. Desative-o em vez de excluir.');
      }
      try {
        await deleteDoc(doc(db, 'doctors', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `doctors/${id}`);
      }
    },
  },

  // 3. Pacientes
  patients: {
    async list(filters?: { search?: string }): Promise<PatientWithStats[]> {
      try {
        const snap = await getDocs(collection(db, 'patients'));
        const patients: Patient[] = [];
        snap.forEach((d) => patients.push(d.data() as Patient));

        const aptsSnap = await getDocs(collection(db, 'appointments'));
        const apts: Appointment[] = [];
        aptsSnap.forEach((a) => apts.push(a.data() as Appointment));

        let result: PatientWithStats[] = patients.map((pat) => {
          const patApts = apts
            .filter((a) => a.patientId === pat.id)
            .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
          return {
            ...pat,
            appointmentsCount: patApts.length,
            lastAppointmentDate: patApts[0]?.date || null,
          };
        });

        if (filters?.search) {
          const term = filters.search.toLowerCase().replace(/\D/g, '');
          const textTerm = filters.search.toLowerCase();
          result = result.filter((p) => {
            const pCpfClean = p.cpf.replace(/\D/g, '');
            const matchesCpf = term.length > 0 && pCpfClean.includes(term);
            const matchesName = p.name.toLowerCase().includes(textTerm);
            const matchesEmail = p.email.toLowerCase().includes(textTerm);
            return matchesName || matchesCpf || matchesEmail;
          });
        }

        return result.sort((a, b) => a.name.localeCompare(b.name));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'patients');
      }
    },

    async getById(id: string): Promise<(PatientWithStats & { appointments: AppointmentWithDetails[] }) | null> {
      try {
        const snap = await getDoc(doc(db, 'patients', id));
        if (!snap.exists()) return null;
        const pat = snap.data() as Patient;
        const appointments = await firestoreService.appointments.list({ patientId: id });
        return {
          ...pat,
          appointmentsCount: appointments.length,
          lastAppointmentDate: appointments[0]?.date || null,
          appointments,
        };
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `patients/${id}`);
      }
    },

    async create(data: unknown): Promise<Patient> {
      const parsed = patientSchema.parse(data);
      const list = await this.list();

      // Constraint: CPF único
      const cleanCPF = parsed.cpf.replace(/\D/g, '');
      if (list.some((p) => p.cpf.replace(/\D/g, '') === cleanCPF)) {
        throw new Error('Já existe um paciente cadastrado com este CPF.');
      }

      const id = `pat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const newPat: Patient = {
        id,
        name: parsed.name,
        cpf: parsed.cpf,
        birthDate: parsed.birthDate,
        gender: parsed.gender,
        phone: parsed.phone,
        email: parsed.email,
        address: parsed.address || null,
        notes: parsed.notes || null,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(doc(db, 'patients', id), newPat);
        return newPat;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `patients/${id}`);
      }
    },

    async update(id: string, data: unknown): Promise<Patient> {
      const parsed = patientSchema.partial().parse(data);
      const current = await this.getById(id);
      if (!current) throw new Error('Paciente não encontrado.');

      if (parsed.cpf) {
        const cleanCPF = parsed.cpf.replace(/\D/g, '');
        const list = await this.list();
        if (list.some((p) => p.id !== id && p.cpf.replace(/\D/g, '') === cleanCPF)) {
          throw new Error('Já existe outro paciente cadastrado com este CPF.');
        }
      }

      const updated: Patient = {
        ...current,
        ...parsed,
        updatedAt: new Date().toISOString(),
      };

      try {
        await updateDoc(doc(db, 'patients', id), updated as any);
        return updated;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `patients/${id}`);
      }
    },

    async delete(id: string): Promise<void> {
      const appointments = await firestoreService.appointments.list({ patientId: id });
      // Regra clínica: Não excluir histórico de consultas realizadas
      if (appointments.some((a) => a.status === 'REALIZADA')) {
        throw new Error('Não é possível excluir um paciente que possui consultas realizadas em seu histórico clínico.');
      }

      try {
        await deleteDoc(doc(db, 'patients', id));
        // Remove consultas pendentes
        for (const apt of appointments) {
          await deleteDoc(doc(db, 'appointments', apt.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `patients/${id}`);
      }
    },
  },

  // 4. Consultas (Appointments)
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
      try {
        const snap = await getDocs(collection(db, 'appointments'));
        const apts: Appointment[] = [];
        snap.forEach((d) => apts.push(d.data() as Appointment));

        const doctors = await firestoreService.doctors.list();
        const patientsSnap = await getDocs(collection(db, 'patients'));
        const patients: Patient[] = [];
        patientsSnap.forEach((d) => patients.push(d.data() as Patient));

        let result: AppointmentWithDetails[] = apts.map((apt) => {
          const docItem = doctors.find((d) => d.id === apt.doctorId);
          const pat = patients.find((p) => p.id === apt.patientId);
          return {
            ...apt,
            doctor: docItem,
            patient: pat,
          };
        });

        if (filters?.date) {
          result = result.filter((a) => a.date === filters.date);
        }
        if (filters?.startDate && filters?.endDate) {
          result = result.filter((a) => a.date >= filters.startDate! && a.date <= filters.endDate!);
        }
        if (filters?.doctorId && filters.doctorId !== 'all') {
          result = result.filter((a) => a.doctorId === filters.doctorId);
        }
        if (filters?.patientId && filters.patientId !== 'all') {
          result = result.filter((a) => a.patientId === filters.patientId);
        }
        if (filters?.specialtyId && filters.specialtyId !== 'all') {
          result = result.filter((a) => a.doctor?.specialtyId === filters.specialtyId);
        }
        if (filters?.status && filters.status !== 'all') {
          result = result.filter((a) => a.status === filters.status);
        }
        if (filters?.search) {
          const term = filters.search.toLowerCase();
          result = result.filter(
            (a) =>
              a.patient?.name.toLowerCase().includes(term) ||
              a.doctor?.name.toLowerCase().includes(term) ||
              a.reason.toLowerCase().includes(term)
          );
        }

        return result.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'appointments');
      }
    },

    async getById(id: string): Promise<AppointmentWithDetails | null> {
      try {
        const snap = await getDoc(doc(db, 'appointments', id));
        if (!snap.exists()) return null;
        const apt = snap.data() as Appointment;
        const docItem = await firestoreService.doctors.getById(apt.doctorId);
        const patSnap = await getDoc(doc(db, 'patients', apt.patientId));
        const pat = patSnap.exists() ? (patSnap.data() as Patient) : undefined;
        return { ...apt, doctor: docItem || undefined, patient: pat };
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `appointments/${id}`);
      }
    },

    async validateRules(
      data: { patientId: string; doctorId: string; date: string; time: string },
      excludeId?: string
    ): Promise<void> {
      // 1. Paciente existe
      const patient = await firestoreService.patients.getById(data.patientId);
      if (!patient) throw new Error('O paciente informado não existe no sistema.');

      // 2. Médico existe
      const doctor = await firestoreService.doctors.getById(data.doctorId);
      if (!doctor) throw new Error('O médico informado não existe no sistema.');

      // 3. Médico não inativo
      if (!doctor.active) {
        throw new Error(`O médico(a) ${doctor.name} está inativo no sistema e não pode receber agendamentos.`);
      }

      // 4. Data não pode ser passada
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (data.date < todayStr) {
        throw new Error('Não é permitido agendar consultas em data anterior ao dia atual.');
      }

      // Conflitos de horário (ignora consultas canceladas)
      const allApts = await this.list();
      const activeApts = allApts.filter((a) => a.id !== excludeId && a.status !== 'CANCELADA');

      // 5. Médico no mesmo horário
      const docConflict = activeApts.find(
        (a) => a.doctorId === data.doctorId && a.date === data.date && a.time === data.time
      );
      if (docConflict) {
        throw new Error(`O médico(a) ${doctor.name} já possui uma consulta agendada para ${data.date} às ${data.time}.`);
      }

      // 6. Paciente no mesmo horário
      const patConflict = activeApts.find(
        (a) => a.patientId === data.patientId && a.date === data.date && a.time === data.time
      );
      if (patConflict) {
        throw new Error(`O paciente ${patient.name} já possui outra consulta agendada para ${data.date} às ${data.time}.`);
      }
    },

    async create(data: unknown): Promise<Appointment> {
      const parsed = appointmentSchema.parse(data);
      await this.validateRules({
        patientId: parsed.patientId,
        doctorId: parsed.doctorId,
        date: parsed.date,
        time: parsed.time,
      });

      const id = `apt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();
      const newApt: Appointment = {
        id,
        patientId: parsed.patientId,
        doctorId: parsed.doctorId,
        date: parsed.date,
        time: parsed.time,
        duration: parsed.duration || 30,
        reason: parsed.reason,
        notes: parsed.notes || null,
        status: parsed.status || 'AGENDADA',
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(doc(db, 'appointments', id), newApt);
        return newApt;
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `appointments/${id}`);
      }
    },

    async update(id: string, data: unknown): Promise<Appointment> {
      const current = await this.getById(id);
      if (!current) throw new Error('Consulta não encontrada.');

      const parsed = appointmentSchema.partial().parse(data);

      const checkPatientId = parsed.patientId ?? current.patientId;
      const checkDoctorId = parsed.doctorId ?? current.doctorId;
      const checkDate = parsed.date ?? current.date;
      const checkTime = parsed.time ?? current.time;

      if (parsed.patientId || parsed.doctorId || parsed.date || parsed.time) {
        await this.validateRules(
          {
            patientId: checkPatientId,
            doctorId: checkDoctorId,
            date: checkDate,
            time: checkTime,
          },
          id
        );
      }

      const updated: Appointment = {
        ...current,
        ...parsed,
        updatedAt: new Date().toISOString(),
      };

      try {
        await updateDoc(doc(db, 'appointments', id), updated as any);
        return updated;
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
      }
    },

    async updateStatus(id: string, status: Appointment['status']): Promise<Appointment> {
      return this.update(id, { status });
    },

    async cancel(id: string, reasonNote?: string): Promise<Appointment> {
      const current = await this.getById(id);
      if (!current) throw new Error('Consulta não encontrada.');

      const notes = reasonNote
        ? `${current.notes ? current.notes + ' | ' : ''}Cancelamento: ${reasonNote}`
        : current.notes;

      return this.update(id, { status: 'CANCELADA', notes });
    },

    async delete(id: string): Promise<void> {
      const current = await this.getById(id);
      if (!current) throw new Error('Consulta não encontrada.');

      // Regra clínica: Não excluir consultas realizadas
      if (current.status === 'REALIZADA') {
        throw new Error('Não é permitido excluir uma consulta que já foi realizada. Apenas o status pode ser alterado.');
      }

      try {
        await deleteDoc(doc(db, 'appointments', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `appointments/${id}`);
      }
    },
  },

  // 5. Dashboard
  dashboard: {
    async getStats(): Promise<DashboardStats> {
      const patients = await firestoreService.patients.list();
      const doctors = await firestoreService.doctors.list();
      const appointments = await firestoreService.appointments.list();

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;

      const appointmentsToday = appointments.filter((a) => a.date === todayStr);
      const appointmentsThisWeek = appointments.filter(
        (a) => a.date >= todayStr && a.date <= nextWeekStr
      );
      const appointmentsPending = appointments.filter(
        (a) => a.status === 'AGENDADA' || a.status === 'CONFIRMADA'
      );
      const appointmentsCompleted = appointments.filter((a) => a.status === 'REALIZADA');
      const appointmentsCancelled = appointments.filter((a) => a.status === 'CANCELADA');

      const upcomingAppointments = appointments
        .filter((a) => a.date >= todayStr && (a.status === 'AGENDADA' || a.status === 'CONFIRMADA'))
        .slice(0, 8);

      return {
        totalPatients: patients.length,
        totalDoctors: doctors.length,
        activeDoctors: doctors.filter((d) => d.active).length,
        appointmentsToday: appointmentsToday.length,
        appointmentsThisWeek: appointmentsThisWeek.length,
        appointmentsPending: appointmentsPending.length,
        appointmentsCompleted: appointmentsCompleted.length,
        appointmentsCancelled: appointmentsCancelled.length,
        upcomingAppointments,
      };
    },
  },
};
