// Camada de Dados e Regras de Negócio do MedAgenda
// Implementa todas as restrições, validações e persistência para Pacientes, Médicos, Especialidades e Consultas.

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

const STORAGE_KEYS = {
  SPECIALTIES: 'medagenda_specialties_v1',
  DOCTORS: 'medagenda_doctors_v1',
  PATIENTS: 'medagenda_patients_v1',
  APPOINTMENTS: 'medagenda_appointments_v1',
};

// Inicialização segura com dados de seed
function getStored<T>(key: string, defaultData: T): T {
  if (typeof window === 'undefined') return defaultData;
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Erro ao carregar chave ${key} do localStorage:`, e);
    return defaultData;
  }
}

function setStored<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Erro ao salvar chave ${key} no localStorage:`, e);
  }
}

// Reset do banco para dados padrão
export function resetDatabaseToSeed(): void {
  const now = new Date().toISOString();
  const specs = initialSpecialties.map((s) => ({ ...s, createdAt: now, updatedAt: now }));
  const docs = initialDoctors.map((d) => ({ ...d, createdAt: now, updatedAt: now }));
  const pats = initialPatients.map((p) => ({ ...p, createdAt: now, updatedAt: now }));
  const apts = getInitialAppointments().map((a) => ({ ...a, createdAt: now, updatedAt: now }));

  setStored(STORAGE_KEYS.SPECIALTIES, specs);
  setStored(STORAGE_KEYS.DOCTORS, docs);
  setStored(STORAGE_KEYS.PATIENTS, pats);
  setStored(STORAGE_KEYS.APPOINTMENTS, apts);
}

// Inicializador padrão
export function initializeDatabase(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.SPECIALTIES)) {
    resetDatabaseToSeed();
  }
}

// ==========================================
// 1. ESPECIALIDADES (Specialties CRUD)
// ==========================================
export const specialtyService = {
  list(): Specialty[] {
    initializeDatabase();
    return getStored<Specialty[]>(STORAGE_KEYS.SPECIALTIES, []);
  },

  getById(id: string): Specialty | null {
    const list = this.list();
    return list.find((s) => s.id === id) || null;
  },

  create(data: unknown): Specialty {
    const parsed = specialtySchema.parse(data);
    const list = this.list();

    // Constraint: O nome da especialidade deve ser único
    const exists = list.some(
      (s) => s.name.toLowerCase() === parsed.name.toLowerCase()
    );
    if (exists) {
      throw new Error('Já existe uma especialidade cadastrada com este nome.');
    }

    const now = new Date().toISOString();
    const newSpecialty: Specialty = {
      id: `spec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: parsed.name,
      description: parsed.description || null,
      active: parsed.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    setStored(STORAGE_KEYS.SPECIALTIES, [...list, newSpecialty]);
    return newSpecialty;
  },

  update(id: string, data: unknown): Specialty {
    const parsed = specialtySchema.partial().parse(data);
    const list = this.list();
    const index = list.findIndex((s) => s.id === id);

    if (index === -1) {
      throw new Error('Especialidade não encontrada.');
    }

    if (parsed.name) {
      const exists = list.some(
        (s) => s.id !== id && s.name.toLowerCase() === parsed.name!.toLowerCase()
      );
      if (exists) {
        throw new Error('Já existe outra especialidade com este nome.');
      }
    }

    const updated: Specialty = {
      ...list[index],
      ...parsed,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    setStored(STORAGE_KEYS.SPECIALTIES, list);
    return updated;
  },

  delete(id: string): void {
    const list = this.list();
    const doctors = doctorService.list();

    // Verificação de integridade referencial
    const hasDoctors = doctors.some((d) => d.specialtyId === id);
    if (hasDoctors) {
      throw new Error(
        'Não é possível excluir esta especialidade pois existem médicos vinculados a ela. Desative-a ou altere os médicos primeiro.'
      );
    }

    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length === list.length) {
      throw new Error('Especialidade não encontrada.');
    }
    setStored(STORAGE_KEYS.SPECIALTIES, filtered);
  },
};

// ==========================================
// 2. MÉDICOS (Doctors CRUD)
// ==========================================
export const doctorService = {
  list(filters?: { search?: string; specialtyId?: string; active?: boolean }): DoctorWithSpecialty[] {
    initializeDatabase();
    const doctors = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
    const specialties = specialtyService.list();
    const appointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);

    let result: DoctorWithSpecialty[] = doctors.map((doc) => {
      const spec = specialties.find((s) => s.id === doc.specialtyId);
      const docAppointments = appointments.filter((a) => a.doctorId === doc.id);
      return {
        ...doc,
        specialty: spec,
        appointmentsCount: docAppointments.length,
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
  },

  getById(id: string): DoctorWithSpecialty | null {
    const doctors = this.list();
    return doctors.find((d) => d.id === id) || null;
  },

  create(data: unknown): Doctor {
    const parsed = doctorSchema.parse(data);
    const list = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, []);

    // Constraint: O CRM deve ser único
    const cleanCRM = parsed.crm.toUpperCase().trim();
    const exists = list.some((d) => d.crm.toUpperCase().trim() === cleanCRM);
    if (exists) {
      throw new Error('Já existe um médico cadastrado com este CRM.');
    }

    // Valida especialidade existente
    const specialty = specialtyService.getById(parsed.specialtyId);
    if (!specialty) {
      throw new Error('A especialidade selecionada não existe.');
    }

    const now = new Date().toISOString();
    const newDoctor: Doctor = {
      id: `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: parsed.name,
      crm: parsed.crm,
      specialtyId: parsed.specialtyId,
      phone: parsed.phone,
      email: parsed.email,
      active: parsed.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    setStored(STORAGE_KEYS.DOCTORS, [...list, newDoctor]);
    return newDoctor;
  },

  update(id: string, data: unknown): Doctor {
    const parsed = doctorSchema.partial().parse(data);
    const list = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
    const index = list.findIndex((d) => d.id === id);

    if (index === -1) {
      throw new Error('Médico não encontrado.');
    }

    if (parsed.crm) {
      const cleanCRM = parsed.crm.toUpperCase().trim();
      const exists = list.some(
        (d) => d.id !== id && d.crm.toUpperCase().trim() === cleanCRM
      );
      if (exists) {
        throw new Error('Já existe outro médico com este CRM.');
      }
    }

    if (parsed.specialtyId) {
      const spec = specialtyService.getById(parsed.specialtyId);
      if (!spec) {
        throw new Error('Especialidade selecionada inválida.');
      }
    }

    const updated: Doctor = {
      ...list[index],
      ...parsed,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    setStored(STORAGE_KEYS.DOCTORS, list);
    return updated;
  },

  delete(id: string): void {
    const list = getStored<Doctor[]>(STORAGE_KEYS.DOCTORS, []);
    const appointments = appointmentService.list();

    const hasAppointments = appointments.some((a) => a.doctorId === id);
    if (hasAppointments) {
      throw new Error(
        'Não é possível excluir este médico pois existem consultas vinculadas ao seu histórico. Você pode inativá-lo para impedir novos agendamentos.'
      );
    }

    const filtered = list.filter((d) => d.id !== id);
    if (filtered.length === list.length) {
      throw new Error('Médico não encontrado.');
    }
    setStored(STORAGE_KEYS.DOCTORS, filtered);
  },

  toggleActive(id: string): Doctor {
    const doc = this.getById(id);
    if (!doc) throw new Error('Médico não encontrado.');
    return this.update(id, { active: !doc.active });
  },
};

// ==========================================
// 3. PACIENTES (Patients CRUD)
// ==========================================
export const patientService = {
  list(filters?: { search?: string }): PatientWithStats[] {
    initializeDatabase();
    const patients = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, []);
    const appointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);

    let result: PatientWithStats[] = patients.map((pat) => {
      const patAppointments = appointments
        .filter((a) => a.patientId === pat.id)
        .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

      return {
        ...pat,
        appointmentsCount: patAppointments.length,
        lastAppointmentDate: patAppointments[0]?.date || null,
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
  },

  getById(id: string): (PatientWithStats & { appointments: AppointmentWithDetails[] }) | null {
    const patients = this.list();
    const patient = patients.find((p) => p.id === id);
    if (!patient) return null;

    const appointments = appointmentService.list({ patientId: id });
    return {
      ...patient,
      appointments,
    };
  },

  create(data: unknown): Patient {
    const parsed = patientSchema.parse(data);
    const list = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, []);

    // Constraint: O CPF deve ser único
    const cleanCPF = parsed.cpf.replace(/\D/g, '');
    const exists = list.some((p) => p.cpf.replace(/\D/g, '') === cleanCPF);
    if (exists) {
      throw new Error('Já existe um paciente cadastrado com este CPF.');
    }

    const now = new Date().toISOString();
    const newPatient: Patient = {
      id: `pat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
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

    setStored(STORAGE_KEYS.PATIENTS, [...list, newPatient]);
    return newPatient;
  },

  update(id: string, data: unknown): Patient {
    const parsed = patientSchema.partial().parse(data);
    const list = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, []);
    const index = list.findIndex((p) => p.id === id);

    if (index === -1) {
      throw new Error('Paciente não encontrado.');
    }

    if (parsed.cpf) {
      const cleanCPF = parsed.cpf.replace(/\D/g, '');
      const exists = list.some(
        (p) => p.id !== id && p.cpf.replace(/\D/g, '') === cleanCPF
      );
      if (exists) {
        throw new Error('Já existe outro paciente cadastrado com este CPF.');
      }
    }

    const updated: Patient = {
      ...list[index],
      ...parsed,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    setStored(STORAGE_KEYS.PATIENTS, list);
    return updated;
  },

  delete(id: string): void {
    const list = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, []);
    const appointments = appointmentService.list({ patientId: id });

    // Regra: se houver consultas realizadas, não permitir excluir
    const hasCompleted = appointments.some((a) => a.status === 'REALIZADA');
    if (hasCompleted) {
      throw new Error(
        'Não é possível excluir um paciente que possui consultas realizadas em seu histórico clínico.'
      );
    }

    const filtered = list.filter((p) => p.id !== id);
    if (filtered.length === list.length) {
      throw new Error('Paciente não encontrado.');
    }
    setStored(STORAGE_KEYS.PATIENTS, filtered);

    // Remove ou cancela agendamentos pendentes do paciente
    const allAppointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const remainingApts = allAppointments.filter((a) => a.patientId !== id);
    setStored(STORAGE_KEYS.APPOINTMENTS, remainingApts);
  },
};

// ==========================================
// 4. CONSULTAS (Appointments CRUD & Business Rules)
// ==========================================
export const appointmentService = {
  list(filters?: {
    date?: string;
    doctorId?: string;
    patientId?: string;
    specialtyId?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): AppointmentWithDetails[] {
    initializeDatabase();
    const appointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const doctors = doctorService.list();
    const patients = getStored<Patient[]>(STORAGE_KEYS.PATIENTS, []);

    let result: AppointmentWithDetails[] = appointments.map((apt) => {
      const doc = doctors.find((d) => d.id === apt.doctorId);
      const pat = patients.find((p) => p.id === apt.patientId);
      return {
        ...apt,
        doctor: doc,
        patient: pat,
      };
    });

    if (filters?.date) {
      result = result.filter((a) => a.date === filters.date);
    }

    if (filters?.startDate && filters?.endDate) {
      result = result.filter(
        (a) => a.date >= filters.startDate! && a.date <= filters.endDate!
      );
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

    // Ordenar por data cronológica e horário
    return result.sort((a, b) => {
      const dateTimeA = `${a.date}T${a.time}`;
      const dateTimeB = `${b.date}T${b.time}`;
      return dateTimeA.localeCompare(dateTimeB);
    });
  },

  getById(id: string): AppointmentWithDetails | null {
    const list = this.list();
    return list.find((a) => a.id === id) || null;
  },

  // Validação central de regras de negócio antes de criar ou atualizar
  validateRules(
    data: {
      patientId: string;
      doctorId: string;
      date: string;
      time: string;
    },
    excludeAppointmentId?: string
  ): void {
    // Regra 1: "O paciente deve existir antes de uma consulta ser criada"
    const patient = patientService.list().find((p) => p.id === data.patientId);
    if (!patient) {
      throw new Error('O paciente informado não existe no sistema.');
    }

    // Regra 2: "O médico deve existir antes de uma consulta ser criada"
    const doctor = doctorService.list().find((d) => d.id === data.doctorId);
    if (!doctor) {
      throw new Error('O médico informado não existe no sistema.');
    }

    // Regra 3: "Não permitir agendar consulta para médico inativo"
    if (!doctor.active) {
      throw new Error(
        `O médico(a) ${doctor.name} está inativo no sistema e não pode receber novos agendamentos.`
      );
    }

    // Regra 4: "Não permitir agendar consulta em data anterior ao dia atual"
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (data.date < todayStr) {
      throw new Error('Não é permitido agendar consultas em data anterior ao dia atual.');
    }

    // Todas as consultas ativas para verificação de conflitos (ignora canceladas)
    const allAppointments = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []).filter(
      (a) => a.id !== excludeAppointmentId && a.status !== 'CANCELADA'
    );

    // Regra 5: "Não permitir duas consultas para o mesmo médico no mesmo horário"
    const doctorConflict = allAppointments.find(
      (a) => a.doctorId === data.doctorId && a.date === data.date && a.time === data.time
    );
    if (doctorConflict) {
      throw new Error(
        `O médico(a) ${doctor.name} já possui uma consulta agendada para ${data.date} às ${data.time}. Escolha outro horário.`
      );
    }

    // Regra 6: "Não permitir duas consultas para o mesmo paciente no mesmo horário"
    const patientConflict = allAppointments.find(
      (a) => a.patientId === data.patientId && a.date === data.date && a.time === data.time
    );
    if (patientConflict) {
      throw new Error(
        `O paciente ${patient.name} já possui outra consulta agendada para ${data.date} às ${data.time}.`
      );
    }
  },

  create(data: unknown): Appointment {
    const parsed = appointmentSchema.parse(data);

    // Aplica regras de negócio
    this.validateRules({
      patientId: parsed.patientId,
      doctorId: parsed.doctorId,
      date: parsed.date,
      time: parsed.time,
    });

    const list = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const now = new Date().toISOString();

    const newAppointment: Appointment = {
      id: `apt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
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

    setStored(STORAGE_KEYS.APPOINTMENTS, [...list, newAppointment]);
    return newAppointment;
  },

  update(id: string, data: unknown): Appointment {
    const list = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const index = list.findIndex((a) => a.id === id);

    if (index === -1) {
      throw new Error('Consulta não encontrada.');
    }

    const current = list[index];
    const parsed = appointmentSchema.partial().parse(data);

    // Se estiver alterando paciente, médico, data ou hora, valida regras de conflito
    const checkPatientId = parsed.patientId ?? current.patientId;
    const checkDoctorId = parsed.doctorId ?? current.doctorId;
    const checkDate = parsed.date ?? current.date;
    const checkTime = parsed.time ?? current.time;

    if (
      parsed.patientId !== undefined ||
      parsed.doctorId !== undefined ||
      parsed.date !== undefined ||
      parsed.time !== undefined
    ) {
      this.validateRules(
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

    list[index] = updated;
    setStored(STORAGE_KEYS.APPOINTMENTS, list);
    return updated;
  },

  updateStatus(id: string, status: Appointment['status']): Appointment {
    return this.update(id, { status });
  },

  cancel(id: string, reasonNote?: string): Appointment {
    // Regra: "Ao cancelar uma consulta, manter o registro no banco."
    const current = this.getById(id);
    if (!current) throw new Error('Consulta não encontrada.');

    const notes = reasonNote
      ? `${current.notes ? current.notes + ' | ' : ''}Cancelamento: ${reasonNote}`
      : current.notes;

    return this.update(id, {
      status: 'CANCELADA',
      notes,
    });
  },

  delete(id: string): void {
    const current = this.getById(id);
    if (!current) {
      throw new Error('Consulta não encontrada.');
    }

    // Regra: "Não excluir consultas que já foram realizadas; permitir apenas alterar o status."
    if (current.status === 'REALIZADA') {
      throw new Error(
        'Não é permitido excluir uma consulta que já foi realizada. Conforme as regras clínicas, o histórico de consultas realizadas deve ser preservado.'
      );
    }

    const list = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
    const filtered = list.filter((a) => a.id !== id);
    setStored(STORAGE_KEYS.APPOINTMENTS, filtered);
  },
};

// ==========================================
// 5. DASHBOARD (Analytics & Summary Stats)
// ==========================================
export const dashboardService = {
  getStats(): DashboardStats {
    initializeDatabase();
    const patients = patientService.list();
    const doctors = doctorService.list();
    const appointments = appointmentService.list();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Cálculo da semana atual (domingo a sábado ou próximos 7 dias)
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

    // Próximas consultas (a partir de hoje, ordenadas)
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
};
