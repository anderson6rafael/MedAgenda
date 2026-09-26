import React from 'react';
import {
  Users,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { DashboardStats, AppointmentWithDetails, Specialty } from '../../types/index.ts';
import { Badge } from '../ui/Badge.tsx';
import { Button } from '../ui/Button.tsx';
import { DashboardReports } from './DashboardReports.tsx';

interface DashboardViewProps {
  stats: DashboardStats | null;
  appointments: AppointmentWithDetails[];
  specialties: Specialty[];
  onNavigateToAgenda: () => void;
  onNavigateToAppointments: () => void;
  onNewAppointment: () => void;
  onViewAppointmentDetails: (appointment: AppointmentWithDetails) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  appointments,
  specialties,
  onNavigateToAgenda,
  onNavigateToAppointments,
  onNewAppointment,
  onViewAppointmentDetails,
}) => {
  if (!stats) return null;

  const metricCards = [
    {
      title: 'Consultas Hoje',
      value: stats.appointmentsToday,
      subtitle: 'Agendadas para a data atual',
      icon: Calendar,
      color: 'teal',
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800',
    },
    {
      title: 'Consultas na Semana',
      value: stats.appointmentsThisWeek,
      subtitle: 'Próximos 7 dias',
      icon: Clock,
      color: 'sky',
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-600 dark:text-sky-400',
      border: 'border-sky-200 dark:border-sky-800',
    },
    {
      title: 'Consultas Pendentes',
      value: stats.appointmentsPending,
      subtitle: 'Agendadas e confirmadas',
      icon: AlertCircle,
      color: 'amber',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
    },
    {
      title: 'Consultas Realizadas',
      value: stats.appointmentsCompleted,
      subtitle: 'Atendimentos finalizados',
      icon: CheckCircle2,
      color: 'emerald',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      title: 'Consultas Canceladas',
      value: stats.appointmentsCancelled,
      subtitle: 'Mantidas em registro histórico',
      icon: XCircle,
      color: 'rose',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
    },
    {
      title: 'Total de Pacientes',
      value: stats.totalPatients,
      subtitle: 'Pacientes cadastrados',
      icon: Users,
      color: 'indigo',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800',
    },
    {
      title: 'Total de Médicos',
      value: stats.totalDoctors,
      subtitle: `${stats.activeDoctors} ativos no sistema`,
      icon: Stethoscope,
      color: 'purple',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-200 dark:border-purple-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/15 text-teal-100 backdrop-blur-xs">
            MedAgenda v1.0
          </span>
          <h2 className="text-xl sm:text-2xl font-bold mt-2">Visão Geral da Clínica</h2>
          <p className="text-xs sm:text-sm text-teal-100/90 mt-1 max-w-xl">
            Acompanhe a movimentação das consultas, disponibilidade dos profissionais e o status dos atendimentos diários.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onNavigateToAgenda}
            leftIcon={<Calendar className="w-4 h-4 text-teal-600" />}
            className="bg-white text-slate-800 hover:bg-teal-50 font-semibold shadow-sm"
          >
            Ver Agenda
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onNewAppointment}
            className="bg-teal-500 hover:bg-teal-400 text-white font-semibold shadow-sm"
          >
            Agendar
          </Button>
        </div>
      </div>

      {/* Grid de Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                    {card.title}
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                    {card.value}
                  </span>
                </div>
                <div className={`p-3 rounded-xl ${card.bg} ${card.text}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Relatórios com Gráficos Recharts (Barras por Especialidade e Pizza por Status) */}
      <DashboardReports appointments={appointments} specialties={specialties} />

      {/* Próximas Consultas + Resumo Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela de Próximas Consultas (2 colunas) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Próximas Consultas
              </h3>
              <p className="text-xs text-slate-500">Agendamentos futuros a partir de hoje</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateToAppointments}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Ver todas
            </Button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {stats.upcomingAppointments.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Não há consultas agendadas para os próximos dias.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-4">Data & Hora</th>
                    <th className="py-3 px-4">Paciente</th>
                    <th className="py-3 px-4">Médico & Especialidade</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                  {stats.upcomingAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      onClick={() => onViewAppointmentDetails(apt)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-teal-600 dark:text-teal-400 font-mono font-bold">
                            {apt.time}
                          </span>
                          <span className="text-slate-400 font-normal text-xs">
                            ({apt.date.split('-').reverse().slice(0, 2).join('/')})
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        {apt.patient?.name || 'Paciente'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div>{apt.doctor?.name || 'Médico'}</div>
                        <span className="text-[11px] text-teal-600 dark:text-teal-400">
                          {apt.doctor?.specialty?.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge status={apt.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewAppointmentDetails(apt);
                          }}
                          className="text-xs text-teal-600 hover:text-teal-700"
                        >
                          Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Resumo da Agenda e Boas Práticas (1 coluna) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-500" />
              Taxa de Efetividade
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribuição de consultas por status geral registrado no banco:
            </p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Realizadas</span>
                  <span className="font-bold text-emerald-600">{stats.appointmentsCompleted}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${
                        stats.appointmentsCompleted + stats.appointmentsCancelled + stats.appointmentsPending > 0
                          ? (stats.appointmentsCompleted /
                              (stats.appointmentsCompleted +
                                stats.appointmentsCancelled +
                                stats.appointmentsPending)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Pendentes / Agendadas</span>
                  <span className="font-bold text-sky-600">{stats.appointmentsPending}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{
                      width: `${
                        stats.appointmentsCompleted + stats.appointmentsCancelled + stats.appointmentsPending > 0
                          ? (stats.appointmentsPending /
                              (stats.appointmentsCompleted +
                                stats.appointmentsCancelled +
                                stats.appointmentsPending)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Canceladas</span>
                  <span className="font-bold text-rose-600">{stats.appointmentsCancelled}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${
                        stats.appointmentsCompleted + stats.appointmentsCancelled + stats.appointmentsPending > 0
                          ? (stats.appointmentsCancelled /
                              (stats.appointmentsCompleted +
                                stats.appointmentsCancelled +
                                stats.appointmentsPending)) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/40">
            <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider mb-2">
              Regras do Sistema
            </h4>
            <ul className="text-xs text-teal-800 dark:text-teal-300 space-y-1.5 list-disc pl-4">
              <li>Não são permitidas duas consultas no mesmo horário para o mesmo médico.</li>
              <li>Não são permitidas duas consultas no mesmo horário para o mesmo paciente.</li>
              <li>Consultas realizadas não podem ser excluídas (histórico protegido).</li>
              <li>Médicos inativos ficam bloqueados para novos agendamentos.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
