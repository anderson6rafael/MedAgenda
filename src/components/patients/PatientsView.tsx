import React, { useState, useMemo } from 'react';
import { PatientWithStats } from '../../types/index.ts';
import { Button } from '../ui/Button.tsx';
import { Input } from '../ui/Input.tsx';
import { EmptyState } from '../ui/EmptyState.tsx';
import { Search, Plus, User, Eye, Edit2, Trash2, Phone, Calendar } from 'lucide-react';

interface PatientsViewProps {
  patients: PatientWithStats[];
  onNewPatient: () => void;
  onEditPatient: (patient: PatientWithStats) => void;
  onViewPatient: (patient: PatientWithStats) => void;
  onDeletePatient: (id: string) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  onNewPatient,
  onEditPatient,
  onViewPatient,
  onDeletePatient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtragem por nome ou CPF
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    const term = searchTerm.toLowerCase();
    const cleanTerm = searchTerm.replace(/\D/g, '');

    return patients.filter((p) => {
      const pCpfClean = p.cpf.replace(/\D/g, '');
      const matchesCpf = cleanTerm.length > 0 && pCpfClean.includes(cleanTerm);
      const matchesName = p.name.toLowerCase().includes(term);
      const matchesEmail = p.email.toLowerCase().includes(term);
      return matchesName || matchesCpf || matchesEmail;
    });
  }, [patients, searchTerm]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage]);

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            Pacientes Cadastrados
          </h2>
          <p className="text-xs text-slate-500">
            Total de {patients.length} paciente(s) no sistema
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Pesquisar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onNewPatient}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Novo Paciente
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {paginatedList.length === 0 ? (
          <EmptyState
            icon={<User className="w-6 h-6" />}
            title="Nenhum paciente encontrado"
            description="Não encontramos pacientes correspondentes aos termos pesquisados."
            actionText="Cadastrar Paciente"
            onAction={onNewPatient}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">CPF</th>
                  <th className="py-3 px-4">Nascimento</th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Consultas</th>
                  <th className="py-3 px-4">Cadastro</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {paginatedList.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 font-bold text-xs flex items-center justify-center shrink-0">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <span>{patient.name}</span>
                          <span className="block text-[11px] font-normal text-slate-400 capitalize">
                            {patient.gender.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {patient.cpf}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {patient.birthDate.split('-').reverse().join('/')}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{patient.phone}</span>
                      </div>
                      <span className="block text-[11px] text-slate-400 truncate max-w-[180px]">
                        {patient.email}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {patient.appointmentsCount || 0} consulta(s)
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(patient.createdAt).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewPatient(patient)}
                          title="Visualizar ficha do paciente"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditPatient(patient)}
                          title="Editar paciente"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeletePatient(patient.id)}
                          title="Excluir paciente"
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
