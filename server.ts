// Servidor Express Full-Stack com API REST e montagem do Vite
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import {
  initialDoctors,
  initialPatients,
  initialSpecialties,
  getInitialAppointments,
} from './prisma/seed.ts';
import {
  appointmentSchema,
  doctorSchema,
  patientSchema,
  specialtySchema,
} from './src/schemas/index.ts';
import {
  Specialty,
  Doctor,
  Patient,
  Appointment,
} from './src/types/index.ts';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database State para o backend
let specialties: Specialty[] = [...initialSpecialties].map((s) => ({
  ...s,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

let doctors: Doctor[] = [...initialDoctors].map((d) => ({
  ...d,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

let patients: Patient[] = [...initialPatients].map((p) => ({
  ...p,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

let appointments: Appointment[] = getInitialAppointments().map((a) => ({
  ...a,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

// ==========================================
// 1. ENDPOINTS: ESPECIALIDADES (/api/specialties)
// ==========================================
app.get('/api/specialties', (req: Request, res: Response) => {
  res.json({ success: true, data: specialties });
});

app.get('/api/specialties/:id', (req: Request, res: Response) => {
  const spec = specialties.find((s) => s.id === req.params.id);
  if (!spec) {
    return res.status(404).json({ success: false, error: 'Especialidade não encontrada.' });
  }
  res.json({ success: true, data: spec });
});

app.post('/api/specialties', (req: Request, res: Response) => {
  try {
    const parsed = specialtySchema.parse(req.body);
    const exists = specialties.some(
      (s) => s.name.toLowerCase() === parsed.name.toLowerCase()
    );
    if (exists) {
      return res.status(409).json({
        success: false,
        error: 'Já existe uma especialidade com este nome.',
      });
    }

    const now = new Date().toISOString();
    const newSpec = {
      id: `spec-${Date.now().toString(36)}`,
      name: parsed.name,
      description: parsed.description || null,
      active: parsed.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    specialties.push(newSpec);
    return res.status(201).json({ success: true, data: newSpec });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Dados inválidos.' });
  }
});

app.put('/api/specialties/:id', (req: Request, res: Response) => {
  try {
    const index = specialties.findIndex((s) => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Especialidade não encontrada.' });
    }

    const parsed = specialtySchema.partial().parse(req.body);
    if (parsed.name) {
      const exists = specialties.some(
        (s) => s.id !== req.params.id && s.name.toLowerCase() === parsed.name!.toLowerCase()
      );
      if (exists) {
        return res.status(409).json({
          success: false,
          error: 'Já existe outra especialidade com este nome.',
        });
      }
    }

    specialties[index] = {
      ...specialties[index],
      ...parsed,
      updatedAt: new Date().toISOString(),
    };
    return res.json({ success: true, data: specialties[index] });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Erro ao atualizar especialidade.' });
  }
});

app.delete('/api/specialties/:id', (req: Request, res: Response) => {
  const hasDoctors = doctors.some((d) => d.specialtyId === req.params.id);
  if (hasDoctors) {
    return res.status(409).json({
      success: false,
      error: 'Não é possível excluir esta especialidade pois existem médicos vinculados a ela.',
    });
  }

  const initialLen = specialties.length;
  specialties = specialties.filter((s) => s.id !== req.params.id);
  if (specialties.length === initialLen) {
    return res.status(404).json({ success: false, error: 'Especialidade não encontrada.' });
  }
  return res.json({ success: true, message: 'Especialidade excluída com sucesso.' });
});

// ==========================================
// 2. ENDPOINTS: MÉDICOS (/api/doctors)
// ==========================================
app.get('/api/doctors', (req: Request, res: Response) => {
  const { search, specialtyId, active } = req.query;

  let result = doctors.map((doc) => {
    const spec = specialties.find((s) => s.id === doc.specialtyId);
    return {
      ...doc,
      specialty: spec,
    };
  });

  if (typeof search === 'string' && search.trim()) {
    const term = search.toLowerCase();
    result = result.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        d.crm.toLowerCase().includes(term) ||
        d.email.toLowerCase().includes(term)
    );
  }

  if (typeof specialtyId === 'string' && specialtyId !== 'all') {
    result = result.filter((d) => d.specialtyId === specialtyId);
  }

  if (active !== undefined && active !== '') {
    result = result.filter((d) => String(d.active) === String(active));
  }

  res.json({ success: true, data: result });
});

app.get('/api/doctors/:id', (req: Request, res: Response) => {
  const doc = doctors.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Médico não encontrado.' });
  }
  const spec = specialties.find((s) => s.id === doc.specialtyId);
  return res.json({ success: true, data: { ...doc, specialty: spec } });
});

app.post('/api/doctors', (req: Request, res: Response) => {
  try {
    const parsed = doctorSchema.parse(req.body);

    // Valida unicidade de CRM
    const cleanCRM = parsed.crm.toUpperCase().trim();
    const exists = doctors.some((d) => d.crm.toUpperCase().trim() === cleanCRM);
    if (exists) {
      return res.status(409).json({ success: false, error: 'Já existe um médico cadastrado com este CRM.' });
    }

    const specExists = specialties.some((s) => s.id === parsed.specialtyId);
    if (!specExists) {
      return res.status(400).json({ success: false, error: 'Especialidade selecionada não existe.' });
    }

    const now = new Date().toISOString();
    const newDoc = {
      id: `doc-${Date.now().toString(36)}`,
      name: parsed.name,
      crm: parsed.crm,
      specialtyId: parsed.specialtyId,
      phone: parsed.phone,
      email: parsed.email,
      active: parsed.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    doctors.push(newDoc);
    return res.status(201).json({ success: true, data: newDoc });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Dados inválidos.' });
  }
});

app.put('/api/doctors/:id', (req: Request, res: Response) => {
  try {
    const index = doctors.findIndex((d) => d.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Médico não encontrado.' });
    }

    const parsed = doctorSchema.partial().parse(req.body);
    if (parsed.crm) {
      const cleanCRM = parsed.crm.toUpperCase().trim();
      const exists = doctors.some(
        (d) => d.id !== req.params.id && d.crm.toUpperCase().trim() === cleanCRM
      );
      if (exists) {
        return res.status(409).json({ success: false, error: 'Já existe outro médico com este CRM.' });
      }
    }

    doctors[index] = {
      ...doctors[index],
      ...parsed,
      updatedAt: new Date().toISOString(),
    };
    return res.json({ success: true, data: doctors[index] });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Erro ao atualizar médico.' });
  }
});

app.delete('/api/doctors/:id', (req: Request, res: Response) => {
  const hasApts = appointments.some((a) => a.doctorId === req.params.id);
  if (hasApts) {
    return res.status(409).json({
      success: false,
      error: 'Não é possível excluir este médico pois existem consultas registradas. Desative-o em vez de excluir.',
    });
  }

  const initialLen = doctors.length;
  doctors = doctors.filter((d) => d.id !== req.params.id);
  if (doctors.length === initialLen) {
    return res.status(404).json({ success: false, error: 'Médico não encontrado.' });
  }
  return res.json({ success: true, message: 'Médico excluído com sucesso.' });
});

// ==========================================
// 3. ENDPOINTS: PACIENTES (/api/patients)
// ==========================================
app.get('/api/patients', (req: Request, res: Response) => {
  const { search } = req.query;
  let result = [...patients];

  if (typeof search === 'string' && search.trim()) {
    const term = search.toLowerCase();
    const cleanTerm = search.replace(/\D/g, '');
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (cleanTerm && p.cpf.replace(/\D/g, '').includes(cleanTerm))
    );
  }

  res.json({ success: true, data: result });
});

app.get('/api/patients/:id', (req: Request, res: Response) => {
  const pat = patients.find((p) => p.id === req.params.id);
  if (!pat) {
    return res.status(404).json({ success: false, error: 'Paciente não encontrado.' });
  }
  const patientApts = appointments.filter((a) => a.patientId === pat.id);
  return res.json({ success: true, data: { ...pat, appointments: patientApts } });
});

app.post('/api/patients', (req: Request, res: Response) => {
  try {
    const parsed = patientSchema.parse(req.body);
    const cleanCPF = parsed.cpf.replace(/\D/g, '');
    const exists = patients.some((p) => p.cpf.replace(/\D/g, '') === cleanCPF);
    if (exists) {
      return res.status(409).json({ success: false, error: 'Já existe um paciente com este CPF.' });
    }

    const now = new Date().toISOString();
    const newPat = {
      id: `pat-${Date.now().toString(36)}`,
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
    patients.push(newPat);
    return res.status(201).json({ success: true, data: newPat });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Dados inválidos.' });
  }
});

app.put('/api/patients/:id', (req: Request, res: Response) => {
  try {
    const index = patients.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Paciente não encontrado.' });
    }

    const parsed = patientSchema.partial().parse(req.body);
    if (parsed.cpf) {
      const cleanCPF = parsed.cpf.replace(/\D/g, '');
      const exists = patients.some(
        (p) => p.id !== req.params.id && p.cpf.replace(/\D/g, '') === cleanCPF
      );
      if (exists) {
        return res.status(409).json({ success: false, error: 'Já existe outro paciente com este CPF.' });
      }
    }

    patients[index] = {
      ...patients[index],
      ...parsed,
      updatedAt: new Date().toISOString(),
    };
    return res.json({ success: true, data: patients[index] });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Erro ao atualizar paciente.' });
  }
});

app.delete('/api/patients/:id', (req: Request, res: Response) => {
  const hasRealizadas = appointments.some(
    (a) => a.patientId === req.params.id && a.status === 'REALIZADA'
  );
  if (hasRealizadas) {
    return res.status(409).json({
      success: false,
      error: 'Não é possível excluir um paciente que possui consultas realizadas em seu histórico.',
    });
  }

  const initialLen = patients.length;
  patients = patients.filter((p) => p.id !== req.params.id);
  if (patients.length === initialLen) {
    return res.status(404).json({ success: false, error: 'Paciente não encontrado.' });
  }
  // Exclui consultas pendentes
  appointments = appointments.filter((a) => a.patientId !== req.params.id);
  return res.json({ success: true, message: 'Paciente excluído com sucesso.' });
});

// ==========================================
// 4. ENDPOINTS: CONSULTAS (/api/appointments)
// ==========================================
app.get('/api/appointments', (req: Request, res: Response) => {
  const { date, doctorId, patientId, specialtyId, status, search, startDate, endDate } = req.query;

  let result = appointments.map((a) => {
    const doc = doctors.find((d) => d.id === a.doctorId);
    const pat = patients.find((p) => p.id === a.patientId);
    const spec = doc ? specialties.find((s) => s.id === doc.specialtyId) : undefined;
    return {
      ...a,
      doctor: doc ? { ...doc, specialty: spec } : undefined,
      patient: pat,
    };
  });

  if (typeof date === 'string' && date) {
    result = result.filter((a) => a.date === date);
  }
  if (typeof startDate === 'string' && typeof endDate === 'string') {
    result = result.filter((a) => a.date >= startDate && a.date <= endDate);
  }
  if (typeof doctorId === 'string' && doctorId !== 'all') {
    result = result.filter((a) => a.doctorId === doctorId);
  }
  if (typeof patientId === 'string' && patientId !== 'all') {
    result = result.filter((a) => a.patientId === patientId);
  }
  if (typeof specialtyId === 'string' && specialtyId !== 'all') {
    result = result.filter((a) => a.doctor?.specialtyId === specialtyId);
  }
  if (typeof status === 'string' && status !== 'all') {
    result = result.filter((a) => a.status === status);
  }
  if (typeof search === 'string' && search) {
    const term = search.toLowerCase();
    result = result.filter(
      (a) =>
        a.patient?.name.toLowerCase().includes(term) ||
        a.doctor?.name.toLowerCase().includes(term) ||
        a.reason.toLowerCase().includes(term)
    );
  }

  res.json({ success: true, data: result });
});

app.get('/api/appointments/:id', (req: Request, res: Response) => {
  const apt = appointments.find((a) => a.id === req.params.id);
  if (!apt) {
    return res.status(404).json({ success: false, error: 'Consulta não encontrada.' });
  }
  const doc = doctors.find((d) => d.id === apt.doctorId);
  const pat = patients.find((p) => p.id === apt.patientId);
  return res.json({ success: true, data: { ...apt, doctor: doc, patient: pat } });
});

app.post('/api/appointments', (req: Request, res: Response) => {
  try {
    const parsed = appointmentSchema.parse(req.body);

    // Regra 1: Paciente deve existir
    const pat = patients.find((p) => p.id === parsed.patientId);
    if (!pat) {
      return res.status(400).json({ success: false, error: 'O paciente informado não existe.' });
    }

    // Regra 2: Médico deve existir
    const doc = doctors.find((d) => d.id === parsed.doctorId);
    if (!doc) {
      return res.status(400).json({ success: false, error: 'O médico informado não existe.' });
    }

    // Regra 3: Não agendar para médico inativo
    if (!doc.active) {
      return res.status(400).json({
        success: false,
        error: `O médico(a) ${doc.name} está inativo e não pode receber agendamentos.`,
      });
    }

    // Regra 4: Não agendar em data passada
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (parsed.date < todayStr) {
      return res.status(400).json({
        success: false,
        error: 'Não é permitido agendar consultas em data anterior ao dia atual.',
      });
    }

    // Regra 5: Conflito de horário do médico
    const activeApts = appointments.filter((a) => a.status !== 'CANCELADA');
    const doctorBusy = activeApts.find(
      (a) => a.doctorId === parsed.doctorId && a.date === parsed.date && a.time === parsed.time
    );
    if (doctorBusy) {
      return res.status(409).json({
        success: false,
        error: `O médico(a) já possui uma consulta agendada para ${parsed.date} às ${parsed.time}.`,
      });
    }

    // Regra 6: Conflito de horário do paciente
    const patientBusy = activeApts.find(
      (a) => a.patientId === parsed.patientId && a.date === parsed.date && a.time === parsed.time
    );
    if (patientBusy) {
      return res.status(409).json({
        success: false,
        error: `O paciente já possui consulta agendada para ${parsed.date} às ${parsed.time}.`,
      });
    }

    const now = new Date().toISOString();
    const newApt = {
      id: `apt-${Date.now().toString(36)}`,
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
    appointments.push(newApt);
    return res.status(201).json({ success: true, data: newApt });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Dados inválidos.' });
  }
});

app.put('/api/appointments/:id', (req: Request, res: Response) => {
  try {
    const index = appointments.findIndex((a) => a.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Consulta não encontrada.' });
    }

    const current = appointments[index];
    const parsed = appointmentSchema.partial().parse(req.body);

    const checkDoc = parsed.doctorId ?? current.doctorId;
    const checkPat = parsed.patientId ?? current.patientId;
    const checkDate = parsed.date ?? current.date;
    const checkTime = parsed.time ?? current.time;

    if (parsed.doctorId || parsed.date || parsed.time) {
      const activeApts = appointments.filter(
        (a) => a.id !== req.params.id && a.status !== 'CANCELADA'
      );
      const doctorBusy = activeApts.find(
        (a) => a.doctorId === checkDoc && a.date === checkDate && a.time === checkTime
      );
      if (doctorBusy) {
        return res.status(409).json({
          success: false,
          error: `Conflito de agenda: o médico já possui consulta agendada para este horário.`,
        });
      }
      const patientBusy = activeApts.find(
        (a) => a.patientId === checkPat && a.date === checkDate && a.time === checkTime
      );
      if (patientBusy) {
        return res.status(409).json({
          success: false,
          error: `Conflito de agenda: o paciente já possui consulta agendada para este horário.`,
        });
      }
    }

    appointments[index] = {
      ...current,
      ...parsed,
      updatedAt: new Date().toISOString(),
    };
    return res.json({ success: true, data: appointments[index] });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Erro ao atualizar consulta.' });
  }
});

app.delete('/api/appointments/:id', (req: Request, res: Response) => {
  const current = appointments.find((a) => a.id === req.params.id);
  if (!current) {
    return res.status(404).json({ success: false, error: 'Consulta não encontrada.' });
  }

  // Regra: Não excluir consultas realizadas
  if (current.status === 'REALIZADA') {
    return res.status(409).json({
      success: false,
      error: 'Não é permitido excluir uma consulta que já foi realizada. Apenas o status pode ser alterado.',
    });
  }

  appointments = appointments.filter((a) => a.id !== req.params.id);
  return res.json({ success: true, message: 'Consulta excluída com sucesso.' });
});

// ==========================================
// 5. DASHBOARD STATS (/api/dashboard)
// ==========================================
app.get('/api/dashboard', (req: Request, res: Response) => {
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
    .map((a) => {
      const doc = doctors.find((d) => d.id === a.doctorId);
      const pat = patients.find((p) => p.id === a.patientId);
      const spec = doc ? specialties.find((s) => s.id === doc.specialtyId) : undefined;
      return { ...a, doctor: doc ? { ...doc, specialty: spec } : undefined, patient: pat };
    })
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, 8);

  res.json({
    success: true,
    data: {
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      activeDoctors: doctors.filter((d) => d.active).length,
      appointmentsToday: appointmentsToday.length,
      appointmentsThisWeek: appointmentsThisWeek.length,
      appointmentsPending: appointmentsPending.length,
      appointmentsCompleted: appointmentsCompleted.length,
      appointmentsCancelled: appointmentsCancelled.length,
      upcomingAppointments,
    },
  });
});

// Seed endpoint
app.post('/api/seed', (req: Request, res: Response) => {
  const now = new Date().toISOString();
  specialties = initialSpecialties.map((s) => ({ ...s, createdAt: now, updatedAt: now }));
  doctors = initialDoctors.map((d) => ({ ...d, createdAt: now, updatedAt: now }));
  patients = initialPatients.map((p) => ({ ...p, createdAt: now, updatedAt: now }));
  appointments = getInitialAppointments().map((a) => ({ ...a, createdAt: now, updatedAt: now }));
  res.json({ success: true, message: 'Dados de seed recarregados com sucesso!' });
});

// Iniciar servidor com Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MedAgenda server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
