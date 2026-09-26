import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.tsx';
import { Button } from '../ui/Button.tsx';
import { Input, Textarea } from '../ui/Input.tsx';
import { Specialty } from '../../types/index.ts';
import { specialtySchema } from '../../schemas/index.ts';
import { Activity, AlertCircle } from 'lucide-react';

interface SpecialtyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  specialtyToEdit?: Specialty | null;
  isLoading?: boolean;
}

export const SpecialtyModal: React.FC<SpecialtyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  specialtyToEdit,
  isLoading = false,
}) => {
  const isEditing = Boolean(specialtyToEdit);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (specialtyToEdit) {
      setName(specialtyToEdit.name);
      setDescription(specialtyToEdit.description || '');
      setActive(specialtyToEdit.active);
    } else {
      setName('');
      setDescription('');
      setActive(true);
    }
    setErrors({});
    setGeneralError(null);
  }, [specialtyToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    const payload = {
      name,
      description: description || null,
      active,
    };

    const validation = specialtySchema.safeParse(payload);
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
      setGeneralError(err.message || 'Erro ao salvar especialidade.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Especialidade' : 'Nova Especialidade'}
      subtitle={
        isEditing
          ? 'Atualize os dados da especialidade médica'
          : 'Cadastre uma nova área de atendimento para os médicos'
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

        <Input
          label="Nome da Especialidade (Único)"
          required
          placeholder="Ex: Cardiologia, Neurologia, Pediatria..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          leftIcon={<Activity className="w-4 h-4" />}
        />

        <Textarea
          label="Descrição da Área"
          placeholder="Descreva as patologias tratadas ou o escopo de atuação (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={errors.description}
          rows={3}
        />

        {/* Toggle Ativo */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Especialidade Ativa
            </span>
            <p className="text-[11px] text-slate-500">
              Especialidades inativas não são sugeridas em novos cadastros.
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
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Especialidade'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
