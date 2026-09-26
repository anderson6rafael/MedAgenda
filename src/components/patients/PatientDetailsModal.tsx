import React from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { PatientWithStats, AppointmentWithDetails } from '../../types/index.ts';
import {
  User,
  CreditCard,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Stethoscope,
  Plus,
  FileText,
} from 'lucide-react';

interface PatientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: (PatientWithStats & { appointments: AppointmentWithDetails[] }) | null;
  onNewAppointmentForPatient: (patientId: string) => void;
  onEditPatient: (patient: PatientWithStats) => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  isOpen,
  onClose,
  patient,
  onNewAppointmentForPatient,
  onEditPatient,
}) => {
  if (!patient) return null;

  // Calcula idade
  const birth = new Date(patient.birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prontuário e Ficha do Paciente"
      subtitle={`Cadastro realizado em ${new Date(patient.createdAt).toLocaleDateString('pt-BR')}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Header do Paciente */}
        <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {patient.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                CPF: <span className="font-mono font-medium">{patient.cpf}</span> •{' '}
                {isNaN(age) ? 'Idade n/d' : `${age} anos`} •{' '}
                <span className="capitalize">{patient.gender.toLowerCase()}</span>
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              onNewAppointmentForPatient(patient.id);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Agendar Consulta
          </Button>
        </div>

        {/* Informações de Contato e Endereço */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Contato
            </span>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              <span>{patient.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Mail className="w-3.5 h-3.5 text-teal-600" />
              <span>{patient.email}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Endereço Residencial
            </span>
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
              <span>{patient.address || 'Endereço não informado.'}</span>
            </div>
          </div>
        </div>

        {/* Observações / Histórico de Alergias */}
        {patient.notes && (
          <div className="p-3.5 rounded-xl border border-amber-200/70 bg-amber-50/50 dark:bg-amber-950/20 text-xs">
            <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              Observações Médicas & Alergias
            </span>
            <p className="text-amber-900 dark:text-amber-200/90 leading-relaxed">
              {patient.notes}
            </p>
          </div>
        )}

        {/* Histórico de Consultas */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Histórico de Consultas ({patient.appointments.length})
            </h4>
          </div>

          {patient.appointments.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-4 text-center border border-dashed rounded-xl">
              Nenhuma consulta registrada para este paciente.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {patient.appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {apt.date.split('-').reverse().join('/')} às {apt.time}
                      </span>
                      <Badge status={apt.status} size="sm" />
                    </div>
                    <div className="text-slate-500 mt-1 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-teal-600" />
                      <span>{apt.doctor?.name}</span> •{' '}
                      <span className="text-teal-600">{apt.doctor?.specialty?.name}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 mt-1 italic">
                      "{apt.reason}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onEditPatient(patient);
            }}
          >
            Editar Cadastro
          </Button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
