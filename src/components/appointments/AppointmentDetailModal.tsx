import React, { useState } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { AppointmentWithDetails, AppointmentStatus } from '../../types/index.ts';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Activity,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Textarea } from '../ui/Input.tsx';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentWithDetails | null;
  onUpdateStatus: (id: string, status: AppointmentStatus) => Promise<void>;
  onCancelWithReason: (id: string, reason: string) => Promise<void>;
  onEdit: (appointment: AppointmentWithDetails) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onUpdateStatus,
  onCancelWithReason,
  onEdit,
  onDelete,
  isLoading = false,
}) => {
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!appointment) return null;

  const handleConfirmCancel = async () => {
    await onCancelWithReason(appointment.id, cancelReason);
    setIsCanceling(false);
    setCancelReason('');
    onClose();
  };

  const isCompleted = appointment.status === 'REALIZADA';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes da Consulta"
      subtitle={`Protocolo: #${appointment.id.slice(-6).toUpperCase()}`}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Status header badge */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Status atual:</span>
            <Badge status={appointment.status} />
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
            <Calendar className="w-3.5 h-3.5 text-teal-500" />
            {appointment.date.split('-').reverse().join('/')} às {appointment.time}
          </div>
        </div>

        {/* Informações do Paciente */}
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-teal-600" />
            Paciente
          </span>
          <div className="font-bold text-slate-900 dark:text-slate-100 text-base">
            {appointment.patient?.name}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
            <div>CPF: <span className="font-medium text-slate-700 dark:text-slate-300">{appointment.patient?.cpf}</span></div>
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{appointment.patient?.phone}</span>
            </div>
            <div className="flex items-center gap-1 col-span-full">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>{appointment.patient?.email}</span>
            </div>
          </div>
        </div>

        {/* Informações do Médico */}
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            Médico Responsável
          </span>
          <div className="font-bold text-slate-900 dark:text-slate-100 text-base">
            {appointment.doctor?.name}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div>CRM: <span className="font-semibold text-slate-700 dark:text-slate-300">{appointment.doctor?.crm}</span></div>
            <div className="text-teal-600 font-semibold">{appointment.doctor?.specialty?.name}</div>
            <Badge
              variant={appointment.doctor?.active ? 'success' : 'danger'}
              size="sm"
            >
              {appointment.doctor?.active ? 'Médico Ativo' : 'Médico Inativo'}
            </Badge>
          </div>
        </div>

        {/* Motivo e Observações */}
        <div className="space-y-3">
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Motivo da Consulta
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              {appointment.reason}
            </p>
          </div>

          {appointment.notes && (
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Observações
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {appointment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sub-painel para Cancelamento */}
        {isCanceling ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Cancelar Consulta (Manter Registro no Banco)
            </h4>
            <Textarea
              placeholder="Descreva o motivo do cancelamento (ex: imprevisto do paciente, remarcação...)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCanceling(false)}
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmCancel}
                isLoading={isLoading}
              >
                Confirmar Cancelamento
              </Button>
            </div>
          </div>
        ) : (
          /* Ações Rápidas de Alteração de Status */
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Alterar Status:
            </span>
            <div className="flex flex-wrap gap-2">
              {appointment.status !== 'CONFIRMADA' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateStatus(appointment.id, 'CONFIRMADA')}
                  isLoading={isLoading}
                >
                  Marcar Confirmada
                </Button>
              )}
              {appointment.status !== 'REALIZADA' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => onUpdateStatus(appointment.id, 'REALIZADA')}
                  isLoading={isLoading}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Marcar Realizada
                </Button>
              )}
              {appointment.status !== 'NAO_COMPARECEU' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onUpdateStatus(appointment.id, 'NAO_COMPARECEU')}
                  isLoading={isLoading}
                >
                  Não compareceu
                </Button>
              )}
              {appointment.status !== 'CANCELADA' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsCanceling(true)}
                  disabled={isLoading}
                >
                  Cancelar Consulta
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Footer com Editar e Excluir */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            {!isCompleted ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(appointment.id)}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Excluir
              </Button>
            ) : (
              <span className="text-[11px] text-slate-400 italic">
                Consulta realizada (histórico protegido contra exclusão)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(appointment);
              }}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Editar
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
