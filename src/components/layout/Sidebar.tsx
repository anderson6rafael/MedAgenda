import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Users,
  Stethoscope,
  Activity,
  X,
  HeartPulse,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'agenda'
  | 'appointments'
  | 'patients'
  | 'doctors'
  | 'specialties';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  counts?: {
    todayAppointments?: number;
    pendingAppointments?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  counts,
}) => {
  const navigationItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Métricas e visão geral',
    },
    {
      id: 'agenda' as NavTab,
      label: 'Agenda',
      icon: Calendar,
      badge: counts?.todayAppointments ? `${counts.todayAppointments} hoje` : undefined,
      description: 'Visão por dia, semana e mês',
    },
    {
      id: 'appointments' as NavTab,
      label: 'Consultas',
      icon: CalendarCheck,
      badge: counts?.pendingAppointments ? String(counts.pendingAppointments) : undefined,
      description: 'Gestão e agendamentos',
    },
    {
      id: 'patients' as NavTab,
      label: 'Pacientes',
      icon: Users,
      description: 'Cadastro e histórico',
    },
    {
      id: 'doctors' as NavTab,
      label: 'Médicos',
      icon: Stethoscope,
      description: 'Corpo clínico e CRM',
    },
    {
      id: 'specialties' as NavTab,
      label: 'Especialidades',
      icon: Activity,
      description: 'Áreas de atendimento',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-inner">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1">
                Med<span className="text-teal-400">Agenda</span>
              </span>
              <span className="text-[10px] block text-slate-400 tracking-wider uppercase font-semibold">
                Gestão Clínica
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu Principal
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-800 text-teal-400 border border-teal-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer info card */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Firestore (AI Studio)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Regras clínicas ativas: Conflitos de horário e médicos inativos prevenidos.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
