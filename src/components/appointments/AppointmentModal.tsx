import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Input, Textarea } from '../ui/Input.tsx';
import { Select } from '../ui/Select.tsx';
import {
  Appointment,
  AppointmentWithDetails,
  DoctorWithSpecialty,
  PatientWithStats,
} from '../../types/index.ts';
import { appointmentSchema } from '../../schemas/index.ts';
import { AlertCircle, Calendar, Clock, Stethoscope, User } from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  appointmentToEdit?: AppointmentWithDetails | null;
  initialDate?: string;
  doctors: DoctorWithSpecialty[];
  patients: PatientWithStats[];
  isLoading?: boolean;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  appointmentToEdit,
  initialDate,
  doctors,
  patients,
  isLoading = false,
}) => {
  const isEditing = Boolean(appointmentToEdit);

  // Form State
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Appointment['status']>('AGENDADA');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Helper hoje formatado YYYY-MM-DD
  const getTodayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (appointmentToEdit) {
      setPatientId(appointmentToEdit.patientId);
      setDoctorId(appointmentToEdit.doctorId);
      setDate(appointmentToEdit.date);
      setTime(appointmentToEdit.time);
      setDuration(appointmentToEdit.duration || 30);
      setReason(appointmentToEdit.reason || '');
      setNotes(appointmentToEdit.notes || '');
      setStatus(appointmentToEdit.status || 'AGENDADA');
    } else {
      setPatientId(patients[0]?.id || '');
      // Seleciona o primeiro médico ATIVO por padrão
      const firstActiveDoctor = doctors.find((d) => d.active);
      setDoctorId(firstActiveDoctor?.id || '');
      setDate(initialDate || getTodayISO());
      setTime('09:00');
      setDuration(30);
      setReason('');
      setNotes('');
      setStatus('AGENDADA');
    }
    setErrors({});
    setGeneralError(null);
  }, [appointmentToEdit, initialDate, isOpen, doctors, patients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    const payload = {
      patientId,
      doctorId,
      date,
      time,
      duration: Number(duration),
      reason,
      notes: notes || null,
      status,
    };

    // Validação com Zod
    const validation = appointmentSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setGeneralError(err.message || 'Erro ao salvar a consulta.');
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === doctorId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Consulta' : 'Nova Consulta'}
      subtitle={
        isEditing
          ? 'Atualize os dados e horários da consulta'
          : 'Preencha as informações para agendar uma nova consulta'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1 font-medium">{generalError}</div>
          </div>
        )}

        {/* Seleção do Paciente */}
        <div>
          <Select
            label="Paciente"
            required
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            error={errors.patientId}
          >
            <option value="" disabled>
              Selecione o paciente...
            </option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — CPF: {p.cpf}
              </option>
            ))}
          </Select>
          {patients.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Nenhum paciente cadastrado. Cadastre um paciente primeiro.
            </p>
          )}
        </div>

        {/* Seleção do Médico */}
        <div>
          <Select
            label="Médico(a) & Especialidade"
            required
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            error={errors.doctorId}
          >
            <option value="" disabled>
              Selecione o médico...
            </option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id} disabled={!d.active}>
                {d.name} — {d.specialty?.name || 'Geral'} ({d.crm})
                {!d.active ? ' [INATIVO - Indisponível]' : ''}
              </option>
            ))}
          </Select>
          {selectedDoctor && !selectedDoctor.active && (
            <p className="text-xs text-rose-500 mt-1 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Médico inativo no sistema. Não é permitido agendar consultas para médicos inativos.
            </p>
          )}
        </div>

        {/* Data e Horário */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Input
              type="date"
              label="Data da Consulta"
              required
              min={getTodayISO()} // Regra: Não permitir data anterior ao dia atual
              value={date}
              onChange={(e) => setDate(e.target.value)}
              error={errors.date}
              leftIcon={<Calendar className="w-4 h-4" />}
            />
          </div>

          <div>
            <Input
              type="time"
              label="Horário"
              required
              step="900" // 15 minutos de intervalo
              value={time}
              onChange={(e) => setTime(e.target.value)}
              error={errors.time}
              leftIcon={<Clock className="w-4 h-4" />}
            />
          </div>

          <div>
            <Select
              label="Duração"
              value={String(duration)}
              onChange={(e) => setDuration(Number(e.target.value))}
              error={errors.duration}
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1h 30min</option>
              <option value="120">2 horas</option>
            </Select>
          </div>
        </div>

        {/* Status (ao editar ou definir inicialmente) */}
        {isEditing && (
          <div>
            <Select
              label="Status da Consulta"
              value={status}
              onChange={(e) => setStatus(e.target.value as Appointment['status'])}
              error={errors.status}
            >
              <option value="AGENDADA">Agendada</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="REALIZADA">Realizada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="NAO_COMPARECEU">Não compareceu</option>
            </Select>
          </div>
        )}

        {/* Motivo da Consulta */}
        <div>
          <Input
            label="Motivo da Consulta"
            required
            placeholder="Ex: Consulta de rotina, queixa de dor, retorno com exames..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={errors.reason}
          />
        </div>

        {/* Observações adicionais */}
        <div>
          <Textarea
            label="Observações da Agenda"
            placeholder="Observações administrativas ou recomendações para o atendimento (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            error={errors.notes}
            rows={2}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            {isEditing ? 'Salvar Alterações' : 'Confirmar Agendamento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
