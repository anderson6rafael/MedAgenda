import React from 'react';
import { Menu, Plus, RefreshCw, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '../ui/Button.tsx';
import { NavTab } from './Sidebar.tsx';

interface HeaderProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onNewAppointment: () => void;
  onResetSeed: () => void;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  onNewAppointment,
  onResetSeed,
  isResetting = false,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Geral',
      subtitle: 'Acompanhamento em tempo real das consultas, corpo clínico e pacientes',
    },
    agenda: {
      title: 'Agenda Médica',
      subtitle: 'Visualização cronológica por dia, semana e mês com filtros inteligentes',
    },
    appointments: {
      title: 'Gestão de Consultas',
      subtitle: 'Controle de agendamentos, confirmações, atendimentos e cancelamentos',
    },
    patients: {
      title: 'Gestão de Pacientes',
      subtitle: 'Cadastro, busca por CPF, histórico e informações de contato',
    },
    doctors: {
      title: 'Corpo Clínico',
      subtitle: 'Médicos cadastrados, CRM, especialidades e controle de disponibilidade',
    },
    specialties: {
      title: 'Especialidades Médicas',
      subtitle: 'Áreas de atendimento da clínica e médicos associados',
    },
  };

  const currentInfo = titles[currentTab] || {
    title: 'MedAgenda',
    subtitle: 'Sistema Clínico',
  };

  // Formata data atual em português
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger + Titles */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {currentInfo.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Date badge, Reset Seed Button & Quick "Nova Consulta" Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
          <CalendarIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span className="capitalize">{todayFormatted}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onResetSeed}
          isLoading={isResetting}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />}
          title="Recarrega dados iniciais fictícios para testes"
          className="hidden sm:inline-flex"
        >
          Recarregar Dados
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onNewAppointment}
          leftIcon={<Plus className="w-4 h-4" />}
          className="font-semibold shadow-md shadow-teal-600/20"
        >
          <span className="hidden sm:inline">Nova Consulta</span>
          <span className="sm:hidden">Agendar</span>
        </Button>
      </div>
    </header>
  );
};
