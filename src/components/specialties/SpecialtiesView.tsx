import React, { useState } from 'react';
import { Specialty, DoctorWithSpecialty } from '../../types/index.ts';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { Activity, Plus, Edit2, Trash2, Stethoscope } from 'lucide-react';

interface SpecialtiesViewProps {
  specialties: Specialty[];
  doctors: DoctorWithSpecialty[];
  onNewSpecialty: () => void;
  onEditSpecialty: (specialty: Specialty) => void;
  onDeleteSpecialty: (id: string) => void;
}

export const SpecialtiesView: React.FC<SpecialtiesViewProps> = ({
  specialties,
  doctors,
  onNewSpecialty,
  onEditSpecialty,
  onDeleteSpecialty,
}) => {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            Especialidades Médicas
          </h2>
          <p className="text-xs text-slate-500">
            {specialties.length} especialidade(s) configurada(s) na clínica
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={onNewSpecialty}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nova Especialidade
        </Button>
      </div>

      {/* Grid of Specialty Cards */}
      {specialties.length === 0 ? (
        <EmptyState
          icon={<Activity className="w-6 h-6" />}
          title="Nenhuma especialidade cadastrada"
          description="Cadastre as especialidades médicas para vincular aos médicos."
          actionText="Nova Especialidade"
          onAction={onNewSpecialty}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialties.map((spec) => {
            const doctorsInSpec = doctors.filter((d) => d.specialtyId === spec.id);

            return (
              <div
                key={spec.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                        <Activity className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {spec.name}
                      </h3>
                    </div>
                    <Badge variant={spec.active ? 'success' : 'danger'} size="sm">
                      {spec.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px] line-clamp-2 leading-relaxed">
                    {spec.description || 'Sem descrição cadastrada.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    <span>{doctorsInSpec.length} médico(s)</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditSpecialty(spec)}
                      title="Editar especialidade"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteSpecialty(spec.id)}
                      title="Excluir especialidade"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
