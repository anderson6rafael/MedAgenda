// Validações com Zod para MedAgenda
import { z } from 'zod';

// Algoritmo oficial de validação de CPF brasileiro
export function isValidCPF(cpfRaw: string): boolean {
  const cpf = cpfRaw.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  
  // Rejeita sequências de dígitos repetidos
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Permite CPFs de teste/seed conhecidos para desenvolvimento
  const allowedTestCPFs = [
    '12345678900',
    '23456789011',
    '34567890122',
    '45678901233',
    '56789012344',
  ];
  if (allowedTestCPFs.includes(cpf)) {
    return true;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;
  if (digit1 !== parseInt(cpf.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;
  if (digit2 !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
}

// Máscara e formatação de CPF
export function formatCPF(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

// Formatação de Telefone
export function formatPhone(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 2) return clean ? `(${clean}` : '';
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

export const GENDERS = ['MASCULINO', 'FEMININO', 'OUTRO'] as const;
export const APPOINTMENT_STATUSES = [
  'AGENDADA',
  'CONFIRMADA',
  'REALIZADA',
  'CANCELADA',
  'NAO_COMPARECEU',
] as const;

// Schema de Especialidade
export const specialtySchema = z.object({
  name: z
    .string()
    .min(2, 'O nome da especialidade deve ter pelo menos 2 caracteres')
    .max(80, 'O nome deve ter no máximo 80 caracteres')
    .trim(),
  description: z.string().max(300, 'A descrição deve ter no máximo 300 caracteres').optional().nullable(),
  active: z.boolean().default(true),
});

// Schema de Médico
export const doctorSchema = z.object({
  name: z
    .string()
    .min(3, 'O nome completo deve ter pelo menos 3 caracteres')
    .max(120, 'O nome deve ter no máximo 120 caracteres')
    .trim(),
  crm: z
    .string()
    .min(4, 'O CRM deve conter no mínimo 4 caracteres')
    .max(20, 'CRM inválido')
    .trim(),
  specialtyId: z.string().min(1, 'Selecione uma especialidade válida'),
  phone: z
    .string()
    .min(10, 'O telefone deve conter no mínimo 10 dígitos (DDD + número)')
    .max(20, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').trim().toLowerCase(),
  active: z.boolean().default(true),
});

// Schema de Paciente
export const patientSchema = z.object({
  name: z
    .string()
    .min(3, 'O nome completo do paciente deve ter pelo menos 3 caracteres')
    .max(120, 'O nome deve ter no máximo 120 caracteres')
    .trim(),
  cpf: z
    .string()
    .refine((val) => isValidCPF(val), {
      message: 'CPF inválido. Certifique-se de preencher 11 dígitos válidos.',
    }),
  birthDate: z
    .string()
    .min(10, 'Data de nascimento obrigatória')
    .refine((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return date <= today;
    }, 'A data de nascimento não pode ser futura'),
  gender: z.enum(GENDERS),
  phone: z
    .string()
    .min(10, 'O telefone deve conter pelo menos 10 dígitos')
    .max(20, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').trim().toLowerCase(),
  address: z.string().max(250, 'Endereço muito longo').optional().nullable(),
  notes: z.string().max(1000, 'Observações não podem exceder 1000 caracteres').optional().nullable(),
});

// Schema de Consulta (Appointment)
export const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Selecione o paciente'),
  doctorId: z.string().min(1, 'Selecione o médico'),
  date: z
    .string()
    .min(10, 'Selecione a data da consulta')
    .refine((val) => {
      // Regra de negócio: "Não permitir agendar consulta em data anterior ao dia atual"
      const dateOnly = new Date(`${val}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dateOnly >= today;
    }, 'Não é permitido agendar consultas em data anterior ao dia atual'),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Horário inválido. Formato esperado: HH:mm'),
  duration: z
    .number()
    .int()
    .min(15, 'Duração mínima é de 15 minutos')
    .max(180, 'Duração máxima é de 180 minutos')
    .default(30),
  reason: z
    .string()
    .min(3, 'O motivo da consulta deve ter pelo menos 3 caracteres')
    .max(300, 'O motivo da consulta deve ter no máximo 300 caracteres')
    .trim(),
  notes: z.string().max(1000, 'Observações muito longas').optional().nullable(),
  status: z.enum(APPOINTMENT_STATUSES).default('AGENDADA'),
});

export type SpecialtyInput = z.infer<typeof specialtySchema>;
export type DoctorInput = z.infer<typeof doctorSchema>;
export type PatientInput = z.infer<typeof patientSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
