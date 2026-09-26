import React, { useState, useMemo } from 'react';
import { DoctorWithSpecialty, Specialty } from '../../types/index.ts';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { Select } from '../ui/Select.tsx';
import { Badge } from '../ui/Badge.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import {
  Search,
  Plus,
  Stethoscope,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Power,
  Activity,
} from 'lucide-react';

interface DoctorsViewProps {
  doctors: DoctorWithSpecialty[];
  specialties: Specialty[];
  onNewDoctor: () => void;
  onEditDoctor: (doctor: DoctorWithSpecialty) => void;
  onToggleActiveDoctor: (id: string) => Promise<void>;
  onDeleteDoctor: (id: string) => void;
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({
  doctors,
  specialties,
  onNewDoctor,
  onEditDoctor,
  onToggleActiveDoctor,
  onDeleteDoctor,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredList = useMemo(() => {
    return doctors.filter((doc) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(term);
        const matchesCrm = doc.crm.toLowerCase().includes(term);
        const matchesEmail = doc.email.toLowerCase().includes(term);
        if (!matchesName && !matchesCrm && !matchesEmail) return false;
      }

      if (specialtyFilter !== 'all' && doc.specialtyId !== specialtyFilter) {
        return false;
      }

      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        if (doc.active !== isActive) return false;
      }

      return true;
    });
  }, [doctors, searchTerm, specialtyFilter, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Top Header and Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Corpo Clínico da Clínica
            </h2>
            <p className="text-xs text-slate-500">
              {doctors.length} médico(s) cadastrado(s) no total
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onNewDoctor}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Cadastrar Novo Médico
          </Button>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Input
            placeholder="Pesquisar por nome ou CRM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <Select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
          >
            <option value="all">Todas as especialidades</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
          </Select>
        </div>
      </div>

      {/* List / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <EmptyState
            icon={<Stethoscope className="w-6 h-6" />}
            title="Nenhum médico encontrado"
            description="Não encontramos médicos correspondentes aos filtros selecionados."
            actionText="Cadastrar Médico"
            onAction={onNewDoctor}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Médico</th>
                  <th className="py-3 px-4">CRM</th>
                  <th className="py-3 px-4">Especialidade</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Consultas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {filteredList.map((doctor) => (
                  <tr
                    key={doctor.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                            doctor.active
                              ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Stethoscope className="w-4 h-4" />
                        </div>
                        <div>
                          <span>{doctor.name}</span>
                          {!doctor.active && (
                            <span className="block text-[10px] text-rose-500 font-normal">
                              Bloqueado para agendamentos
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {doctor.crm}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium text-xs">
                        <Activity className="w-3 h-3" />
                        {doctor.specialty?.name || 'Clínica Geral'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{doctor.phone}</span>
                      </div>
                      <span className="block text-[11px] text-slate-400 truncate max-w-[180px]">
                        {doctor.email}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {doctor.appointmentsCount || 0} consulta(s)
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={doctor.active ? 'success' : 'danger'} size="sm">
                        {doctor.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleActiveDoctor(doctor.id)}
                          title={doctor.active ? 'Desativar médico' : 'Ativar médico'}
                          className={doctor.active ? 'text-amber-600' : 'text-emerald-600'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditDoctor(doctor)}
                          title="Editar dados do médico"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteDoctor(doctor.id)}
                          title="Excluir médico"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
