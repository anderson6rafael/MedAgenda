import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Select } from '../ui/Select.tsx';
import { Doctor, Specialty } from '../../types/index.ts';
import { doctorSchema, formatPhone } from '../../schemas/index.ts';
import { AlertCircle, Stethoscope, Award, Phone, Mail, CheckCircle2 } from 'lucide-react';

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  doctorToEdit?: Doctor | null;
  specialties: Specialty[];
  isLoading?: boolean;
}

export const DoctorModal: React.FC<DoctorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  doctorToEdit,
  specialties,
  isLoading = false,
}) => {
  const isEditing = Boolean(doctorToEdit);

  const [name, setName] = useState('');
  const [crm, setCrm] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (doctorToEdit) {
      setName(doctorToEdit.name);
      setCrm(doctorToEdit.crm);
      setSpecialtyId(doctorToEdit.specialtyId);
      setPhone(doctorToEdit.phone);
      setEmail(doctorToEdit.email);
      setActive(doctorToEdit.active);
    } else {
      setName('');
      setCrm('');
      setSpecialtyId(specialties[0]?.id || '');
      setPhone('');
      setEmail('');
      setActive(true);
    }
    setErrors({});
    setGeneralError(null);
  }, [doctorToEdit, specialties, isOpen]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    const payload = {
      name,
      crm,
      specialtyId,
      phone,
      email,
      active,
    };

    const validation = doctorSchema.safeParse(payload);
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
      setGeneralError(err.message || 'Erro ao salvar o médico.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Médico' : 'Cadastrar Novo Médico'}
      subtitle={
        isEditing
          ? 'Atualize os dados e disponibilidade do médico'
          : 'Cadastre um novo profissional para o corpo clínico da clínica'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1 font-medium">{generalError}</div>
          </div>
        )}

        {/* Nome do Médico */}
        <Input
          label="Nome Completo do Médico"
          required
          placeholder="Ex: Dr. Carlos Eduardo Menezes"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          leftIcon={<Stethoscope className="w-4 h-4" />}
        />

        {/* CRM e Especialidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="CRM (Único)"
            required
            placeholder="Ex: 123456/SP"
            value={crm}
            onChange={(e) => setCrm(e.target.value.toUpperCase())}
            error={errors.crm}
            leftIcon={<Award className="w-4 h-4" />}
          />

          <Select
            label="Especialidade"
            required
            value={specialtyId}
            onChange={(e) => setSpecialtyId(e.target.value)}
            error={errors.specialtyId}
          >
            <option value="" disabled>
              Selecione a especialidade...
            </option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {!s.active ? '(Inativa)' : ''}
              </option>
            ))}
          </Select>
        </div>

        {/* Telefone e E-mail */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Telefone / Contato"
            required
            placeholder="(11) 98765-4321"
            value={phone}
            onChange={handlePhoneChange}
            error={errors.phone}
            maxLength={15}
            leftIcon={<Phone className="w-4 h-4" />}
          />

          <Input
            type="email"
            label="E-mail Profissional"
            required
            placeholder="medico@medagenda.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
          />
        </div>

        {/* Status Ativo/Inativo */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Disponibilidade no Sistema
            </span>
            <p className="text-[11px] text-slate-500">
              Médicos inativos não aparecem como opção para novos agendamentos de consulta.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              active ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                active ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Médico'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
