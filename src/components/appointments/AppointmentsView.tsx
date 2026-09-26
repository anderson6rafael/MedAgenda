import React, { useState, useMemo } from 'react';
import {
  AppointmentWithDetails,
  DoctorWithSpecialty,
  PatientWithStats,
  Specialty,
  AppointmentStatus,
} from '../../types/index.ts';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Input } from '../ui/Input.tsx';
import { Select } from '../ui/Select.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import {
  Search,
  Plus,
  Calendar,
  Clock,
  Filter,
  Eye,
  Trash2,
  CalendarCheck,
  X,
} from 'lucide-react';

interface AppointmentsViewProps {
  appointments: AppointmentWithDetails[];
  doctors: DoctorWithSpecialty[];
  patients: PatientWithStats[];
  specialties: Specialty[];
  onNewAppointment: () => void;
  onEditAppointment: (appointment: AppointmentWithDetails) => void;
  onViewAppointmentDetails: (appointment: AppointmentWithDetails) => void;
  onDeleteAppointment: (id: string) => void;
  onQuickStatusChange: (id: string, status: AppointmentStatus) => Promise<void>;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  doctors,
  patients,
  specialties,
  onNewAppointment,
  onEditAppointment,
  onViewAppointmentDetails,
  onDeleteAppointment,
  onQuickStatusChange,
}) => {
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [patientFilter, setPatientFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtragem
  const filteredList = useMemo(() => {
    return appointments.filter((apt) => {
      // Busca por texto (paciente, médico ou motivo)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const patName = apt.patient?.name.toLowerCase() || '';
        const docName = apt.doctor?.name.toLowerCase() || '';
        const reason = apt.reason.toLowerCase();
        if (
          !patName.includes(term) &&
          !docName.includes(term) &&
          !reason.includes(term)
        ) {
          return false;
        }
      }

      if (dateFilter && apt.date !== dateFilter) return false;
      if (doctorFilter !== 'all' && apt.doctorId !== doctorFilter) return false;
      if (patientFilter !== 'all' && apt.patientId !== patientFilter) return false;
      if (
        specialtyFilter !== 'all' &&
        apt.doctor?.specialtyId !== specialtyFilter
      )
        return false;
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;

      return true;
    });
  }, [
    appointments,
    searchTerm,
    dateFilter,
    doctorFilter,
    patientFilter,
    specialtyFilter,
    statusFilter,
  ]);

  // Paginação aplicada
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(dateFilter) ||
    doctorFilter !== 'all' ||
    patientFilter !== 'all' ||
    specialtyFilter !== 'all' ||
    statusFilter !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setDoctorFilter('all');
    setPatientFilter('all');
    setSpecialtyFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Actions */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Listagem de Consultas
            </h2>
            <p className="text-xs text-slate-500">
              {filteredList.length} consulta(s) encontrada(s) no sistema
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onNewAppointment}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Agendar Nova Consulta
          </Button>
        </div>

        {/* Search bar & filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {/* Busca textual */}
          <div className="sm:col-span-2">
            <Input
              placeholder="Buscar por paciente, médico ou motivo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Filtro por Data */}
          <div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Calendar className="w-4 h-4" />}
            />
          </div>

          {/* Filtro por Médico */}
          <div>
            <Select
              value={doctorFilter}
              onChange={(e) => {
                setDoctorFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Todos os Médicos</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Filtro por Especialidade */}
          <div>
            <Select
              value={specialtyFilter}
              onChange={(e) => {
                setSpecialtyFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Todas as Especialidades</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Filtro por Status */}
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Todos os Status</option>
              <option value="AGENDADA">Agendada</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="REALIZADA">Realizada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="NAO_COMPARECEU">Não compareceu</option>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Filtros ativos aplicados</span>
            <button
              onClick={clearFilters}
              className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Table & Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {paginatedList.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="w-6 h-6" />}
            title="Nenhuma consulta encontrada"
            description="Não encontramos agendamentos correspondentes aos critérios de busca ou filtros selecionados."
            actionText="Agendar Consulta"
            onAction={onNewAppointment}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Data & Horário</th>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Médico & CRM</th>
                  <th className="py-3 px-4">Especialidade</th>
                  <th className="py-3 px-4">Motivo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {paginatedList.map((apt) => (
                  <tr
                    key={apt.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {apt.date.split('-').reverse().join('/')}
                        </span>
                        <span className="text-teal-600 font-mono font-semibold text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {apt.time} ({apt.duration} min)
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {apt.patient?.name}
                      <span className="block text-[11px] font-normal text-slate-400">
                        {apt.patient?.phone}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <span className="font-medium block">{apt.doctor?.name}</span>
                      <span className="text-[11px] text-slate-400">
                        CRM: {apt.doctor?.crm}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-teal-600 dark:text-teal-400 font-medium text-xs">
                        {apt.doctor?.specialty?.name || 'Clínica Geral'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                      {apt.reason}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge status={apt.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewAppointmentDetails(apt)}
                          title="Visualizar detalhes da consulta"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Ver
                        </Button>
                        {apt.status !== 'REALIZADA' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteAppointment(apt.id)}
                            title="Excluir agendamento"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
