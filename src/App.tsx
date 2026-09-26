import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/ui/Toast.tsx';
import { Sidebar, NavTab } from './components/layout/Sidebar.tsx';
import { Header } from './components/layout/Header.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { AgendaView } from './components/agenda/AgendaView.tsx';
import { AppointmentsView } from './components/appointments/AppointmentsView.tsx';
import { AppointmentModal } from './components/appointments/AppointmentModal.tsx';
import { AppointmentDetailModal } from './components/appointments/AppointmentDetailModal.tsx';
import { PatientsView } from './components/patients/PatientsView.tsx';
import { PatientModal } from './components/patients/PatientModal.tsx';
import { PatientDetailsModal } from './components/patients/PatientDetailsModal.tsx';
import { DoctorsView } from './components/doctors/DoctorsView.tsx';
import { DoctorModal } from './components/doctors/DoctorModal.tsx';
import { SpecialtiesView } from './components/specialties/SpecialtiesView.tsx';
import { SpecialtyModal } from './components/specialties/SpecialtyModal.tsx';
import { ConfirmDialog } from './components/ui/ConfirmDialog.tsx';
import { LoadingSpinner } from './components/ui/EmptyState.tsx';
import GhostFibers from './GhostFibers';
import { api } from './lib/api.ts';
import {
  AppointmentStatus,
  AppointmentWithDetails,
  DashboardStats,
  DoctorWithSpecialty,
  PatientWithStats,
  Specialty,
} from './types/index.ts';

function MedAgendaApp() {
  const toast = useToast();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [patients, setPatients] = useState<PatientWithStats[]>([]);
  const [doctors, setDoctors] = useState<DoctorWithSpecialty[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Modals State: Appointment
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<AppointmentWithDetails | null>(null);
  const [initialAppointmentDate, setInitialAppointmentDate] = useState<string | undefined>(undefined);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);

  // Modals State: Patient
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<PatientWithStats | null>(null);
  const [isPatientDetailModalOpen, setIsPatientDetailModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<
    (PatientWithStats & { appointments: AppointmentWithDetails[] }) | null
  >(null);

  // Modals State: Doctor
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<DoctorWithSpecialty | null>(null);

  // Modals State: Specialty
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
  const [specialtyToEdit, setSpecialtyToEdit] = useState<Specialty | null>(null);

  // Generic Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

  // Carrega todos os dados principais da aplicação
  const loadData = useCallback(async () => {
    try {
      await api.init();
      const [statsData, aptsData, patsData, docsData, specsData] = await Promise.all([
        api.getDashboardStats(),
        api.appointments.list(),
        api.patients.list(),
        api.doctors.list(),
        api.specialties.list(),
      ]);

      setStats(statsData);
      setAppointments(aptsData);
      setPatients(patsData);
      setDoctors(docsData);
      setSpecialties(specsData);
    } catch (err: any) {
      toast.error('Erro ao sincronizar dados da aplicação: ' + (err.message || ''));
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recarregar seed inicial de demonstração
  const handleResetSeed = async () => {
    setIsResetting(true);
    try {
      await api.resetSeed();
      await loadData();
      toast.success('Banco de dados recarregado com os dados fictícios iniciais!');
    } catch (e: any) {
      toast.error('Erro ao recarregar dados de seed: ' + e.message);
    } finally {
      setIsResetting(false);
    }
  };

  // ==========================================
  // HANDLERS: CONSULTAS (Appointments)
  // ==========================================
  const handleOpenNewAppointment = (date?: string) => {
    setAppointmentToEdit(null);
    setInitialAppointmentDate(date);
    setIsAppointmentModalOpen(true);
  };

  const handleOpenEditAppointment = (appointment: AppointmentWithDetails) => {
    setAppointmentToEdit(appointment);
    setIsAppointmentModalOpen(true);
  };

  const handleViewAppointmentDetails = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setIsDetailModalOpen(true);
  };

  const handleSaveAppointment = async (payload: any) => {
    if (appointmentToEdit) {
      await api.appointments.update(appointmentToEdit.id, payload);
      toast.success('Consulta atualizada com sucesso!');
    } else {
      await api.appointments.create(payload);
      toast.success('Consulta agendada com sucesso!');
    }
    await loadData();
    setIsAppointmentModalOpen(false);
  };

  const handleQuickStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await api.appointments.updateStatus(id, status);
      toast.success(`Status da consulta alterado para: ${status}`);
      await loadData();
      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar o status da consulta.');
    }
  };

  const handleCancelAppointmentWithReason = async (id: string, reason: string) => {
    try {
      await api.appointments.cancel(id, reason);
      toast.success('Consulta cancelada com sucesso. O histórico foi mantido no banco.');
      await loadData();
      setIsDetailModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar a consulta.');
    }
  };

  const handleDeleteAppointment = (id: string) => {
    const apt = appointments.find((a) => a.id === id);
    if (!apt) return;

    if (apt.status === 'REALIZADA') {
      toast.warning(
        'Não é permitido excluir uma consulta que já foi realizada. Apenas o status pode ser modificado.'
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Consulta',
      description: `Tem certeza de que deseja excluir o agendamento de ${apt.patient?.name} em ${apt.date} às ${apt.time}?`,
      onConfirm: async () => {
        try {
          await api.appointments.delete(id);
          toast.success('Consulta excluída com sucesso.');
          await loadData();
          setIsDetailModalOpen(false);
        } catch (err: any) {
          toast.error(err.message || 'Erro ao excluir consulta.');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ==========================================
  // HANDLERS: PACIENTES (Patients)
  // ==========================================
  const handleOpenNewPatient = () => {
    setPatientToEdit(null);
    setIsPatientModalOpen(true);
  };

  const handleOpenEditPatient = (patient: PatientWithStats) => {
    setPatientToEdit(patient);
    setIsPatientModalOpen(true);
  };

  const handleViewPatient = async (patient: PatientWithStats) => {
    const detailed = await api.patients.getById(patient.id);
    setSelectedPatient(detailed);
    setIsPatientDetailModalOpen(true);
  };

  const handleSavePatient = async (payload: any) => {
    if (patientToEdit) {
      await api.patients.update(patientToEdit.id, payload);
      toast.success('Dados do paciente atualizados com sucesso!');
    } else {
      await api.patients.create(payload);
      toast.success('Paciente cadastrado com sucesso!');
    }
    await loadData();
    setIsPatientModalOpen(false);
  };

  const handleDeletePatient = (id: string) => {
    const patient = patients.find((p) => p.id === id);
    if (!patient) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Paciente',
      description: `Deseja realmente excluir o cadastro de "${patient.name}"? Esta ação removerá os dados cadastrais. Se houver consultas realizadas, a exclusão será bloqueada pelas regras clínicas.`,
      onConfirm: async () => {
        try {
          await api.patients.delete(id);
          toast.success('Paciente excluído com sucesso.');
          await loadData();
        } catch (err: any) {
          toast.error(err.message || 'Não foi possível excluir o paciente.');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ==========================================
  // HANDLERS: MÉDICOS (Doctors)
  // ==========================================
  const handleOpenNewDoctor = () => {
    setDoctorToEdit(null);
    setIsDoctorModalOpen(true);
  };

  const handleOpenEditDoctor = (doctor: DoctorWithSpecialty) => {
    setDoctorToEdit(doctor);
    setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = async (payload: any) => {
    if (doctorToEdit) {
      await api.doctors.update(doctorToEdit.id, payload);
      toast.success('Dados do médico atualizados com sucesso!');
    } else {
      await api.doctors.create(payload);
      toast.success('Médico cadastrado com sucesso!');
    }
    await loadData();
    setIsDoctorModalOpen(false);
  };

  const handleToggleActiveDoctor = async (id: string) => {
    try {
      const updated = await api.doctors.toggleActive(id);
      toast.info(
        `Médico ${updated.name} foi marcado como ${updated.active ? 'ATIVO' : 'INATIVO'}.`
      );
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar disponibilidade do médico.');
    }
  };

  const handleDeleteDoctor = (id: string) => {
    const doc = doctors.find((d) => d.id === id);
    if (!doc) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Médico',
      description: `Tem certeza de que deseja excluir o médico "${doc.name}"? Se houver consultas vinculadas a ele, você deverá inativá-lo em vez de excluir.`,
      onConfirm: async () => {
        try {
          await api.doctors.delete(id);
          toast.success('Médico excluído com sucesso.');
          await loadData();
        } catch (err: any) {
          toast.error(err.message || 'Erro ao excluir médico.');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // ==========================================
  // HANDLERS: ESPECIALIDADES (Specialties)
  // ==========================================
  const handleOpenNewSpecialty = () => {
    setSpecialtyToEdit(null);
    setIsSpecialtyModalOpen(true);
  };

  const handleOpenEditSpecialty = (specialty: Specialty) => {
    setSpecialtyToEdit(specialty);
    setIsSpecialtyModalOpen(true);
  };

  const handleSaveSpecialty = async (payload: any) => {
    if (specialtyToEdit) {
      await api.specialties.update(specialtyToEdit.id, payload);
      toast.success('Especialidade atualizada com sucesso!');
    } else {
      await api.specialties.create(payload);
      toast.success('Especialidade criada com sucesso!');
    }
    await loadData();
    setIsSpecialtyModalOpen(false);
  };

  const handleDeleteSpecialty = (id: string) => {
    const spec = specialties.find((s) => s.id === id);
    if (!spec) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Especialidade',
      description: `Deseja realmente excluir a especialidade "${spec.name}"? Se houver médicos cadastrados nesta especialidade, a exclusão será bloqueada.`,
      onConfirm: async () => {
        try {
          await api.specialties.delete(id);
          toast.success('Especialidade excluída com sucesso.');
          await loadData();
        } catch (err: any) {
          toast.error(err.message || 'Erro ao excluir especialidade.');
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased relative overflow-x-hidden">
      {/* Background Animated Atmosphere */}
      <div className="absolute top-0 left-0 right-0 z-0 pointer-events-none overflow-hidden opacity-35 dark:opacity-45">
        <div style={{ width: '100%', height: '600px', position: 'relative' }}>
          <GhostFibers
            lineColor="#5abc5c"
            glowColor="#248438"
            speed={0.2}
            scale={2}
            rotation={0}
            rotationSpeed={0.25}
            layers={4}
            waveAmplitude={0.015}
            waveFrequency={3}
            waveSpeed={0.15}
            layerSpeed={0.08}
            twist={0.1}
            twistFrequency={5}
            twistSpeed={1.2}
            lineFrequency={5}
            lineSpacing={2}
            lineSharpness={16}
            glowFalloff={10}
            glowIntensity={1.6}
            brightness={2}
            blueBoost={1.25}
            vignette={0.8}
            grain={0.05}
            dpr={1}
            lightMode={false}
            fps={60}
            paused={false}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/75 to-slate-50 dark:via-slate-950/75 dark:to-slate-950 pointer-events-none" />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        counts={{
          todayAppointments: stats?.appointmentsToday,
          pendingAppointments: stats?.appointmentsPending,
        }}
      />

      {/* Main Container */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 relative z-10">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNewAppointment={() => handleOpenNewAppointment()}
          onResetSeed={handleResetSeed}
          isResetting={isResetting}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <LoadingSpinner text="Inicializando sistema de consultas clínicas..." />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  appointments={appointments}
                  specialties={specialties}
                  onNavigateToAgenda={() => setCurrentTab('agenda')}
                  onNavigateToAppointments={() => setCurrentTab('appointments')}
                  onNewAppointment={() => handleOpenNewAppointment()}
                  onViewAppointmentDetails={handleViewAppointmentDetails}
                />
              )}

              {currentTab === 'agenda' && (
                <AgendaView
                  appointments={appointments}
                  doctors={doctors}
                  specialties={specialties}
                  onSelectAppointment={handleViewAppointmentDetails}
                  onNewAppointmentWithDate={(date) => handleOpenNewAppointment(date)}
                />
              )}

              {currentTab === 'appointments' && (
                <AppointmentsView
                  appointments={appointments}
                  doctors={doctors}
                  patients={patients}
                  specialties={specialties}
                  onNewAppointment={() => handleOpenNewAppointment()}
                  onEditAppointment={handleOpenEditAppointment}
                  onViewAppointmentDetails={handleViewAppointmentDetails}
                  onDeleteAppointment={handleDeleteAppointment}
                  onQuickStatusChange={handleQuickStatusChange}
                />
              )}

              {currentTab === 'patients' && (
                <PatientsView
                  patients={patients}
                  onNewPatient={handleOpenNewPatient}
                  onEditPatient={handleOpenEditPatient}
                  onViewPatient={handleViewPatient}
                  onDeletePatient={handleDeletePatient}
                />
              )}

              {currentTab === 'doctors' && (
                <DoctorsView
                  doctors={doctors}
                  specialties={specialties}
                  onNewDoctor={handleOpenNewDoctor}
                  onEditDoctor={handleOpenEditDoctor}
                  onToggleActiveDoctor={handleToggleActiveDoctor}
                  onDeleteDoctor={handleDeleteDoctor}
                />
              )}

              {currentTab === 'specialties' && (
                <SpecialtiesView
                  specialties={specialties}
                  doctors={doctors}
                  onNewSpecialty={handleOpenNewSpecialty}
                  onEditSpecialty={handleOpenEditSpecialty}
                  onDeleteSpecialty={handleDeleteSpecialty}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ==================================================== */}
      {/* MODALS GLOBAIS */}
      {/* ==================================================== */}

      {/* Modal Consulta: Criar / Editar */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onSubmit={handleSaveAppointment}
        appointmentToEdit={appointmentToEdit}
        initialDate={initialAppointmentDate}
        doctors={doctors}
        patients={patients}
      />

      {/* Modal Consulta: Detalhes e Status */}
      <AppointmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        appointment={selectedAppointment}
        onUpdateStatus={handleQuickStatusChange}
        onCancelWithReason={handleCancelAppointmentWithReason}
        onEdit={(apt) => {
          setIsDetailModalOpen(false);
          handleOpenEditAppointment(apt);
        }}
        onDelete={(id) => {
          setIsDetailModalOpen(false);
          handleDeleteAppointment(id);
        }}
      />

      {/* Modal Paciente: Criar / Editar */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSubmit={handleSavePatient}
        patientToEdit={patientToEdit}
      />

      {/* Modal Paciente: Detalhes e Histórico */}
      <PatientDetailsModal
        isOpen={isPatientDetailModalOpen}
        onClose={() => setIsPatientDetailModalOpen(false)}
        patient={selectedPatient}
        onNewAppointmentForPatient={(patientId) => {
          setAppointmentToEdit(null);
          setIsAppointmentModalOpen(true);
        }}
        onEditPatient={(patient) => {
          setIsPatientDetailModalOpen(false);
          handleOpenEditPatient(patient);
        }}
      />

      {/* Modal Médico: Criar / Editar */}
      <DoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        onSubmit={handleSaveDoctor}
        doctorToEdit={doctorToEdit}
        specialties={specialties}
      />

      {/* Modal Especialidade: Criar / Editar */}
      <SpecialtyModal
        isOpen={isSpecialtyModalOpen}
        onClose={() => setIsSpecialtyModalOpen(false)}
        onSubmit={handleSaveSpecialty}
        specialtyToEdit={specialtyToEdit}
      />

      {/* Modal Confirmação Genérico */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MedAgendaApp />
    </ToastProvider>
  );
}
