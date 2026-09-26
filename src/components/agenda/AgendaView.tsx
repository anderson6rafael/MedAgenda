import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Clock,
  User,
  Stethoscope,
  Activity,
  Plus,
} from 'lucide-react';
import {
  AppointmentWithDetails,
  DoctorWithSpecialty,
  Specialty,
} from '../../types/index.ts';
import { Button } from '../ui/Button.tsx';
import { Badge } from '../ui/Badge.tsx';
import { Select } from '../ui/Select.tsx';

interface AgendaViewProps {
  appointments: AppointmentWithDetails[];
  doctors: DoctorWithSpecialty[];
  specialties: Specialty[];
  onSelectAppointment: (appointment: AppointmentWithDetails) => void;
  onNewAppointmentWithDate?: (date: string) => void;
}

type ViewMode = 'day' | 'week' | 'month';

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  doctors,
  specialties,
  onSelectAppointment,
  onNewAppointmentWithDate,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Formatador helper YYYY-MM-DD
  const formatDateISO = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Navegação
  const handlePrevious = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') next.setDate(next.getDate() - 1);
    else if (viewMode === 'week') next.setDate(next.getDate() - 7);
    else if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') next.setDate(next.getDate() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtragem de consultas
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (selectedDoctorId !== 'all' && apt.doctorId !== selectedDoctorId) return false;
      if (
        selectedSpecialtyId !== 'all' &&
        apt.doctor?.specialtyId !== selectedSpecialtyId
      )
        return false;
      if (selectedStatus !== 'all' && apt.status !== selectedStatus) return false;
      return true;
    });
  }, [appointments, selectedDoctorId, selectedSpecialtyId, selectedStatus]);

  // Consultas indexadas por data
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentWithDetails[]>();
    filteredAppointments.forEach((apt) => {
      const list = map.get(apt.date) || [];
      list.push(apt);
      map.set(apt.date, list);
    });
    return map;
  }, [filteredAppointments]);

  // Gera dias da semana (Segunda a Domingo)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay(); // 0 is Sun, 1 is Mon...
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // ajusta para segunda
    const monday = new Date(curr.setDate(diff));

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Gera dias do mês em grade 7 colunas
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Preenche dias antes do dia 1 da semana (segunda-feira como base)
    let startDayOfWeek = firstDay.getDay(); // 0 is Dom, 1 is Seg
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // 0=Seg, 6=Dom
    for (let i = startDayOfWeek; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Dias do mês atual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Preenche restante até fechar semanas completas (múltiplo de 7)
    const remainder = days.length % 7;
    if (remainder > 0) {
      for (let i = 1; i <= 7 - remainder; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
    }

    return days;
  }, [currentDate]);

  // Título do cabeçalho da agenda de acordo com a visão
  const headerTitle = useMemo(() => {
    if (viewMode === 'day') {
      return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(currentDate);
    }
    if (viewMode === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      const startMonth = start.toLocaleDateString('pt-BR', { month: 'short' });
      const endMonth = end.toLocaleDateString('pt-BR', { month: 'short' });
      return `${start.getDate()} de ${startMonth} - ${end.getDate()} de ${endMonth}, ${end.getFullYear()}`;
    }
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'long',
      year: 'numeric',
    }).format(currentDate);
  }, [viewMode, currentDate, weekDays]);

  const todayStr = formatDateISO(new Date());

  return (
    <div className="space-y-5">
      {/* Top Controls: Navigation, View Mode Switch, Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Date Selector Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              aria-label="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              aria-label="Próximo período"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 capitalize ml-2">
              {headerTitle}
            </h2>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Mês
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="text-xs"
          >
            <option value="all">Todos os médicos</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.crm})
              </option>
            ))}
          </Select>

          <Select
            value={selectedSpecialtyId}
            onChange={(e) => setSelectedSpecialtyId(e.target.value)}
            className="text-xs"
          >
            <option value="all">Todas as especialidades</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>

          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs"
          >
            <option value="all">Todos os status</option>
            <option value="AGENDADA">Agendada</option>
            <option value="CONFIRMADA">Confirmada</option>
            <option value="REALIZADA">Realizada</option>
            <option value="CANCELADA">Cancelada</option>
            <option value="NAO_COMPARECEU">Não compareceu</option>
          </Select>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. VISÃO DE DIA (Day View) */}
      {/* ==================================================== */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Horários e Consultas do Dia
            </span>
            {onNewAppointmentWithDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNewAppointmentWithDate(formatDateISO(currentDate))}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Agendar neste dia
              </Button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(() => {
              const dayStr = formatDateISO(currentDate);
              const dayApts = (appointmentsByDate.get(dayStr) || []).sort((a, b) =>
                a.time.localeCompare(b.time)
              );

              if (dayApts.length === 0) {
                return (
                  <div className="p-12 text-center text-slate-500 text-sm">
                    Nenhuma consulta agendada para este dia com os filtros selecionados.
                  </div>
                );
              }

              return dayApts.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => onSelectAppointment(apt)}
                  className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono font-bold text-base shrink-0 text-center border border-teal-200 dark:border-teal-800">
                      {apt.time}
                      <span className="block text-[10px] text-teal-600/80 font-normal">
                        {apt.duration} min
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                          {apt.patient?.name}
                        </h4>
                        <Badge status={apt.status} size="sm" />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                          {apt.doctor?.name} ({apt.doctor?.crm})
                        </span>
                        <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                          <Activity className="w-3.5 h-3.5" />
                          {apt.doctor?.specialty?.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                        "{apt.reason}"
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-end sm:self-center text-xs text-teal-600 hover:text-teal-700"
                  >
                    Ver Detalhes
                  </Button>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. VISÃO DE SEMANA (Week View) */}
      {/* ==================================================== */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {weekDays.map((date) => {
            const dateStr = formatDateISO(date);
            const isToday = dateStr === todayStr;
            const dayApts = (appointmentsByDate.get(dateStr) || []).sort((a, b) =>
              a.time.localeCompare(b.time)
            );

            return (
              <div
                key={dateStr}
                className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs flex flex-col min-h-[360px] ${
                  isToday
                    ? 'border-teal-500 ring-2 ring-teal-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Day Header */}
                <div
                  className={`p-3 text-center border-b rounded-t-2xl ${
                    isToday
                      ? 'bg-teal-500 text-white border-teal-600'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider block opacity-90">
                    {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-extrabold">{date.getDate()}</span>
                </div>

                {/* Day Content */}
                <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[420px]">
                  {dayApts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-400 text-xs">
                      <span>Sem consultas</span>
                      {onNewAppointmentWithDate && (
                        <button
                          onClick={() => onNewAppointmentWithDate(dateStr)}
                          className="mt-2 text-[11px] text-teal-600 hover:underline cursor-pointer"
                        >
                          + Agendar
                        </button>
                      )}
                    </div>
                  ) : (
                    dayApts.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => onSelectAppointment(apt)}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 hover:border-teal-300 transition-all cursor-pointer text-left space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-teal-700 dark:text-teal-400">
                            {apt.time}
                          </span>
                          <Badge status={apt.status} size="sm" />
                        </div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {apt.patient?.name}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                          {apt.doctor?.name}
                        </div>
                        <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate">
                          {apt.doctor?.specialty?.name}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. VISÃO DE MÊS (Month View) */}
      {/* ==================================================== */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 py-2.5">
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
            <div>Dom</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {monthDays.map(({ date, isCurrentMonth }, idx) => {
              const dateStr = formatDateISO(date);
              const isToday = dateStr === todayStr;
              const dayApts = appointmentsByDate.get(dateStr) || [];

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDate(date);
                    setViewMode('day');
                  }}
                  className={`min-h-[90px] sm:min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                    !isCurrentMonth ? 'opacity-40 bg-slate-50/50 dark:bg-slate-900/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-teal-500 text-white' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayApts.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                        {dayApts.length}
                      </span>
                    )}
                  </div>

                  {/* Appointments chips */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayApts.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                      >
                        <span className="text-teal-600 font-bold mr-1">{apt.time}</span>
                        {apt.patient?.name}
                      </div>
                    ))}
                    {dayApts.length > 2 && (
                      <div className="text-[9px] text-slate-400 font-semibold pl-1">
                        +{dayApts.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
