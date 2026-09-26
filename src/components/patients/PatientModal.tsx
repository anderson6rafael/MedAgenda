import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Input, Textarea } from '../ui/Input.tsx';
import { Select } from '../ui/Select.tsx';
import { Patient } from '../../types/index.ts';
import { formatCPF, formatPhone, patientSchema } from '../../schemas/index.ts';
import { AlertCircle, User, CreditCard, Calendar, Phone, Mail, MapPin } from 'lucide-react';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  patientToEdit?: Patient | null;
  isLoading?: boolean;
}

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patientToEdit,
  isLoading = false,
}) => {
  const isEditing = Boolean(patientToEdit);

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'MASCULINO' | 'FEMININO' | 'OUTRO'>('FEMININO');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (patientToEdit) {
      setName(patientToEdit.name);
      setCpf(patientToEdit.cpf);
      setBirthDate(patientToEdit.birthDate.split('T')[0]);
      setGender(patientToEdit.gender);
      setPhone(patientToEdit.phone);
      setEmail(patientToEdit.email);
      setAddress(patientToEdit.address || '');
      setNotes(patientToEdit.notes || '');
    } else {
      setName('');
      setCpf('');
      setBirthDate('');
      setGender('FEMININO');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
    }
    setErrors({});
    setGeneralError(null);
  }, [patientToEdit, isOpen]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    const payload = {
      name,
      cpf,
      birthDate,
      gender,
      phone,
      email,
      address: address || null,
      notes: notes || null,
    };

    const validation = patientSchema.safeParse(payload);
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
      setGeneralError(err.message || 'Erro ao salvar o paciente.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Paciente' : 'Novo Paciente'}
      subtitle={
        isEditing
          ? 'Atualize os dados cadastrais do paciente'
          : 'Cadastre um novo paciente para agendamento de consultas'
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

        {/* Nome Completo */}
        <Input
          label="Nome Completo"
          required
          placeholder="Ex: Mariana Souza Ribeiro"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          leftIcon={<User className="w-4 h-4" />}
        />

        {/* CPF e Data de Nascimento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="CPF (Único)"
            required
            placeholder="000.000.000-00"
            value={cpf}
            onChange={handleCpfChange}
            error={errors.cpf}
            maxLength={14}
            leftIcon={<CreditCard className="w-4 h-4" />}
          />

          <Input
            type="date"
            label="Data de Nascimento"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            error={errors.birthDate}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </div>

        {/* Sexo, Telefone e E-mail */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Sexo"
            required
            value={gender}
            onChange={(e) => setGender(e.target.value as any)}
            error={errors.gender}
          >
            <option value="FEMININO">Feminino</option>
            <option value="MASCULINO">Masculino</option>
            <option value="OUTRO">Outro</option>
          </Select>

          <Input
            label="Telefone / Celular"
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
            label="E-mail"
            required
            placeholder="paciente@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            leftIcon={<Mail className="w-4 h-4" />}
          />
        </div>

        {/* Endereço */}
        <Input
          label="Endereço Completo"
          placeholder="Rua, número, complemento, bairro, cidade/UF (opcional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          error={errors.address}
          leftIcon={<MapPin className="w-4 h-4" />}
        />

        {/* Observações / Alergias */}
        <Textarea
          label="Observações Clínicas / Alergias"
          placeholder="Alergias conhecidas, doenças crônicas ou notas relevantes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          error={errors.notes}
          rows={2}
        />

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Paciente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
