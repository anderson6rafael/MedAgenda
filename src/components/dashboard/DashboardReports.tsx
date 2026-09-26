import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  AppointmentWithDetails,
  Specialty,
} from '../../types/index.ts';
import { BarChart3, PieChart as PieChartIcon, Activity, CheckCircle2, TrendingUp } from 'lucide-react';

interface DashboardReportsProps {
  appointments: AppointmentWithDetails[];
  specialties: Specialty[];
}

export const DashboardReports: React.FC<DashboardReportsProps> = ({
  appointments,
  specialties,
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'month' | 'week'>('all');

  // Filtra consultas por período selecionado
  const filteredAppointments = useMemo(() => {
    if (selectedTimeRange === 'all') return appointments;

    const today = new Date();
    const thresholdDate = new Date();

    if (selectedTimeRange === 'week') {
      thresholdDate.setDate(today.getDate() - 7);
    } else if (selectedTimeRange === 'month') {
      thresholdDate.setMonth(today.getMonth() - 1);
    }

    const thresholdStr = thresholdDate.toISOString().split('T')[0];
    return appointments.filter((a) => a.date >= thresholdStr);
  }, [appointments, selectedTimeRange]);

  // 1. Dados para o Gráfico de Barras: Consultas por Especialidade
  const specialtyData = useMemo(() => {
    const countsMap = new Map<string, number>();

    // Inicializa com todas as especialidades cadastradas
    specialties.forEach((spec) => {
      countsMap.set(spec.name, 0);
    });

    // Conta consultas
    filteredAppointments.forEach((apt) => {
      const specName = apt.doctor?.specialty?.name || 'Clínica Geral';
      countsMap.set(specName, (countsMap.get(specName) || 0) + 1);
    });

    const data = Array.from(countsMap.entries()).map(([name, total]) => ({
      name,
      total,
    }));

    // Ordena da especialidade com mais consultas para a com menos
    return data.sort((a, b) => b.total - a.total);
  }, [specialties, filteredAppointments]);

  // 2. Dados para o Gráfico de Pizza: Distribuição de Status das Consultas
  const statusData = useMemo(() => {
    let agendadas = 0;
    let realizadas = 0;
    let canceladas = 0;
    let naoCompareceu = 0;

    filteredAppointments.forEach((apt) => {
      if (apt.status === 'AGENDADA' || apt.status === 'CONFIRMADA') {
        agendadas++;
      } else if (apt.status === 'REALIZADA') {
        realizadas++;
      } else if (apt.status === 'CANCELADA') {
        canceladas++;
      } else if (apt.status === 'NAO_COMPARECEU') {
        naoCompareceu++;
      }
    });

    const data = [
      { name: 'Agendadas/Confirmadas', value: agendadas, color: '#0ea5e9' }, // Sky 500
      { name: 'Realizadas', value: realizadas, color: '#10b981' }, // Emerald 500
      { name: 'Canceladas', value: canceladas, color: '#f43f5e' }, // Rose 500
    ];

    if (naoCompareceu > 0) {
      data.push({ name: 'Não compareceu', value: naoCompareceu, color: '#94a3b8' });
    }

    return data;
  }, [filteredAppointments]);

  const totalFiltered = filteredAppointments.length;
  const mostPopularSpecialty = specialtyData[0]?.total > 0 ? specialtyData[0] : null;

  return (
    <div className="space-y-4">
      {/* Cabeçalho da Seção de Relatórios */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Relatórios e Análise de Consultas
            </h3>
            <p className="text-xs text-slate-500">
              Métricas gráficas de demanda por especialidade e taxa de comparecimento
            </p>
          </div>
        </div>

        {/* Seletor de Período */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setSelectedTimeRange('week')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedTimeRange === 'week'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => setSelectedTimeRange('month')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedTimeRange === 'month'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Último mês
          </button>
          <button
            onClick={() => setSelectedTimeRange('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              selectedTimeRange === 'all'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todo o histórico
          </button>
        </div>
      </div>

      {/* Grid de Gráficos (2 colunas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Gráfico de Barras: Consultas por Especialidade */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Volume de Consultas por Especialidade
              </h4>
            </div>
            {mostPopularSpecialty && (
              <span className="text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Maior procura: {mostPopularSpecialty.name} ({mostPopularSpecialty.total})
              </span>
            )}
          </div>

          <div className="h-72 w-full">
            {totalFiltered === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhuma consulta registrada no período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={specialtyData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(20, 184, 166, 0.08)' }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    }}
                    formatter={(value: any) => [`${value} consulta(s)`, 'Total']}
                    labelStyle={{ fontWeight: 'bold', color: '#5eead4' }}
                  />
                  <Bar
                    dataKey="total"
                    name="Consultas"
                    fill="#0d9488"
                    radius={[6, 6, 0, 0]}
                  >
                    {specialtyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#0d9488' : '#14b8a6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Total de {specialties.length} especialidades analisadas
          </p>
        </div>

        {/* 2. Gráfico de Pizza: Distribuição de Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Distribuição de Status das Consultas
              </h4>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {totalFiltered} consulta(s) no total
            </span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {totalFiltered === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhum dado disponível para o gráfico de pizza.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`status-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      color: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} consulta(s) (${totalFiltered > 0 ? ((Number(value) / totalFiltered) * 100).toFixed(1) : 0}%)`,
                      name,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Cards de Resumo Rápido de Status */}
          <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            {statusData.slice(0, 3).map((item, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <span className="text-[10px] block text-slate-400 uppercase font-semibold truncate">
                  {item.name}
                </span>
                <span
                  className="text-base font-extrabold block mt-0.5"
                  style={{ color: item.color }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
