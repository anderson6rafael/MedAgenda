// Prisma Seed para MedAgenda
// Dados fictícios consistentes para especialidades, médicos, pacientes e consultas

export const initialSpecialties = [
  {
    id: "spec-cardio",
    name: "Cardiologia",
    description: "Diagnóstico e tratamento de doenças do coração e do sistema circulatório.",
    active: true,
  },
  {
    id: "spec-derma",
    name: "Dermatologia",
    description: "Cuidados clínicos, estéticos e cirúrgicos da pele, cabelos e unhas.",
    active: true,
  },
  {
    id: "spec-pediatria",
    name: "Pediatria",
    description: "Acompanhamento do desenvolvimento e saúde de recém-nascidos, crianças e adolescentes.",
    active: true,
  },
  {
    id: "spec-ortopedia",
    name: "Ortopedia",
    description: "Tratamento de traumas, ossos, articulações, ligamentos e coluna vertebral.",
    active: true,
  },
  {
    id: "spec-neuro",
    name: "Neurologia",
    description: "Investigação e conduta em distúrbios do sistema nervoso central e periférico.",
    active: true,
  },
  {
    id: "spec-oftalmo",
    name: "Oftalmologia",
    description: "Saúde visual, refração, cirurgias e patologias oculares.",
    active: true,
  },
  {
    id: "spec-clinica",
    name: "Clínica Geral",
    description: "Atendimento primário e integral à saúde do adulto e medicina preventiva.",
    active: true,
  },
  {
    id: "spec-gineco",
    name: "Ginecologia e Obstetrícia",
    description: "Saúde reprodutiva feminina, pré-natal, parto e menopausa.",
    active: true,
  },
];

export const initialDoctors = [
  {
    id: "doc-1",
    name: "Dr. Carlos Eduardo Menezes",
    crm: "123456/SP",
    specialtyId: "spec-cardio",
    phone: "(11) 98765-4321",
    email: "carlos.menezes@medagenda.com.br",
    active: true,
  },
  {
    id: "doc-2",
    name: "Dra. Beatriz Helena Rossi",
    crm: "987654/SP",
    specialtyId: "spec-derma",
    phone: "(11) 97654-3210",
    email: "beatriz.rossi@medagenda.com.br",
    active: true,
  },
  {
    id: "doc-3",
    name: "Dr. Roberto Albuquerque",
    crm: "543210/RJ",
    specialtyId: "spec-pediatria",
    phone: "(21) 99876-1122",
    email: "roberto.albuquerque@medagenda.com.br",
    active: true,
  },
  {
    id: "doc-4",
    name: "Dra. Juliana Prado Vasconcelos",
    crm: "345678/MG",
    specialtyId: "spec-ortopedia",
    phone: "(31) 98456-7890",
    email: "juliana.vasconcelos@medagenda.com.br",
    active: true,
  },
  {
    id: "doc-5",
    name: "Dr. Fernando Henrique Lima",
    crm: "765432/SP",
    specialtyId: "spec-clinica",
    phone: "(11) 97123-4567",
    email: "fernando.lima@medagenda.com.br",
    active: true,
  },
  {
    id: "doc-6",
    name: "Dra. Renata Siqueira Castro",
    crm: "234567/RS",
    specialtyId: "spec-neuro",
    phone: "(51) 99112-3344",
    email: "renata.castro@medagenda.com.br",
    active: false, // Inativo para testar validação de médico inativo
  },
];

export const initialPatients = [
  {
    id: "pat-1",
    name: "Mariana Souza Ribeiro",
    cpf: "123.456.789-00",
    birthDate: "1990-05-14",
    gender: "FEMININO" as const,
    phone: "(11) 98111-2233",
    email: "mariana.ribeiro@email.com",
    address: "Av. Paulista, 1000, Apto 42, Bela Vista - São Paulo/SP",
    notes: "Alérgica a dipirona e anti-inflamatórios não-esteroidais.",
  },
  {
    id: "pat-2",
    name: "Lucas Gabriel Ferreira",
    cpf: "234.567.890-11",
    birthDate: "1985-11-28",
    gender: "MASCULINO" as const,
    phone: "(11) 98222-3344",
    email: "lucas.ferreira@email.com",
    address: "Rua Augusta, 450, Consolação - São Paulo/SP",
    notes: "Histórico familiar de hipertensão arterial.",
  },
  {
    id: "pat-3",
    name: "Ana Clara Fagundes",
    cpf: "345.678.901-22",
    birthDate: "2016-08-20",
    gender: "FEMININO" as const,
    phone: "(11) 98333-4455",
    email: "pais.anaclara@email.com",
    address: "Rua Vergueiro, 2200, Vila Mariana - São Paulo/SP",
    notes: "Acompanhamento pediátrico regular, vacinação em dia.",
  },
  {
    id: "pat-4",
    name: "Marcos Vinicius Santos",
    cpf: "456.789.012-33",
    birthDate: "1978-03-09",
    gender: "MASCULINO" as const,
    phone: "(11) 98444-5566",
    email: "marcos.santos@email.com",
    address: "Rua Domingos de Morais, 810 - São Paulo/SP",
    notes: "Dor crônica no joelho esquerdo pós-trauma esportivo.",
  },
  {
    id: "pat-5",
    name: "Camila Duarte Martins",
    cpf: "567.890.123-44",
    birthDate: "1994-12-03",
    gender: "FEMININO" as const,
    phone: "(11) 98555-6677",
    email: "camila.martins@email.com",
    address: "Rua Oscar Freire, 120, Jardins - São Paulo/SP",
    notes: "Acompanhamento dermatológico preventivo.",
  },
];

// Helper to generate dynamic dates relative to current date (YYYY-MM-DD)
export function getRelativeDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getInitialAppointments() {
  const today = getRelativeDate(0);
  const tomorrow = getRelativeDate(1);
  const inTwoDays = getRelativeDate(2);
  const inThreeDays = getRelativeDate(3);
  const yesterday = getRelativeDate(-1);
  const lastWeek = getRelativeDate(-5);

  return [
    {
      id: "apt-1",
      patientId: "pat-1",
      doctorId: "doc-1",
      date: today,
      time: "09:00",
      duration: 30,
      reason: "Avaliação cardiológica de rotina e eletrocardiograma",
      notes: "Paciente relatou palpitações ocasionais durante exercícios.",
      status: "CONFIRMADA" as const,
    },
    {
      id: "apt-2",
      patientId: "pat-2",
      doctorId: "doc-5",
      date: today,
      time: "10:30",
      duration: 30,
      reason: "Check-up geral anual e renovação de exames de sangue",
      notes: "Trazer exames laboratoriais anteriores se disponíveis.",
      status: "AGENDADA" as const,
    },
    {
      id: "apt-3",
      patientId: "pat-3",
      doctorId: "doc-3",
      date: today,
      time: "14:00",
      duration: 45,
      reason: "Consulta de puericultura e acompanhamento de crescimento",
      notes: "Mãe acompanhará a consulta.",
      status: "CONFIRMADA" as const,
    },
    {
      id: "apt-4",
      patientId: "pat-4",
      doctorId: "doc-4",
      date: tomorrow,
      time: "11:00",
      duration: 30,
      reason: "Avaliação ortopédica de dor no joelho",
      notes: "Trazer ressonância magnética realizada recentemente.",
      status: "AGENDADA" as const,
    },
    {
      id: "apt-5",
      patientId: "pat-5",
      doctorId: "doc-2",
      date: tomorrow,
      time: "15:30",
      duration: 30,
      reason: "Mapeamento de pintas e lesões dermatológicas",
      notes: "Primeira consulta na clínica.",
      status: "CONFIRMADA" as const,
    },
    {
      id: "apt-6",
      patientId: "pat-1",
      doctorId: "doc-2",
      date: inTwoDays,
      time: "16:00",
      duration: 30,
      reason: "Procedimento estético e hidratação facial",
      notes: "",
      status: "AGENDADA" as const,
    },
    {
      id: "apt-7",
      patientId: "pat-2",
      doctorId: "doc-1",
      date: inThreeDays,
      time: "08:30",
      duration: 30,
      reason: "Retorno pós-exames cardiológicos",
      notes: "Avaliar resultado do MAPA e Holter 24h.",
      status: "AGENDADA" as const,
    },
    {
      id: "apt-8",
      patientId: "pat-4",
      doctorId: "doc-5",
      date: yesterday,
      time: "16:00",
      duration: 30,
      reason: "Consulta de rotina e medição de pressão arterial",
      notes: "Pressão aferida em 120/80 mmHg. Excelente controle.",
      status: "REALIZADA" as const,
    },
    {
      id: "apt-9",
      patientId: "pat-5",
      doctorId: "doc-1",
      date: lastWeek,
      time: "14:00",
      duration: 30,
      reason: "Sintomas de fadiga e falta de ar ao subir escadas",
      notes: "Solicitado ecocardiograma transtorácico.",
      status: "REALIZADA" as const,
    },
    {
      id: "apt-10",
      patientId: "pat-2",
      doctorId: "doc-4",
      date: yesterday,
      time: "09:30",
      duration: 30,
      reason: "Dor lombar aguda",
      notes: "Paciente solicitou cancelamento por imprevisto profissional.",
      status: "CANCELADA" as const,
    },
    {
      id: "apt-11",
      patientId: "pat-1",
      doctorId: "doc-5",
      date: lastWeek,
      time: "10:00",
      duration: 30,
      reason: "Retorno clínico geral",
      notes: "Paciente não compareceu e não justificou ausência.",
      status: "NAO_COMPARECEU" as const,
    },
  ];
}
