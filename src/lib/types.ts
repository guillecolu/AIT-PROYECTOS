

export interface AppConfig {
    logoUrl: string | null;
}

export type UserRole = string;

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar: string; // URL to avatar image
  assignedProjectIds: string[];
  order?: number;
}

export type ProjectStatus = 'activo' | 'cerrado' | 'pausado';
export type StageStatus = 'pendiente' | 'en_proceso' | 'completo';

export interface Stage {
    nombre: TaskComponent;
    estado: StageStatus;
    responsableId: string;
    fechaInicio?: string;
    fechaFinEstimada?: string;
    fechaFinReal?: string;
    porcentaje: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  path: string; // path in Storage
  size: number; // in bytes
  type: string; // MIME type
  uploadedAt: string; // ISO date string
  uploadedBy: string; // user id
}


export interface Part {
  id: string;
  name: string;
  stages: Stage[];
  progress?: number;
  attachments?: Attachment[];
}


export interface ProjectNote {
  id: string;
  author: string;
  date: string;
  content: string;
}

export type AlertType = 'ATRASADA' | 'PROXIMA' | 'SIN_ASIGNAR' | 'BLOQUEADA';

export interface AlertItem {
    type: AlertType;
    taskId: string;
}

export interface ProjectAlerts {
    id: string; // YYYYMMDD
    projectId: string;
    createdAt: string; // ISO String
    counters: {
        atrasadas: number;
        proximas: number;
        sinAsignar: number;
        bloqueadas: number;
    };
    items: AlertItem[];
}


export interface Project {
  id: string;
  numero?: string;
  name: string;
  client: string;
  status: ProjectStatus;
  startDate: string; // ISO date string
  deliveryDate: string; // ISO date string
  projectManagerId: string;
  engineerIds: string[];
  progress: number; // 0-100
  parts: Part[];
  notes?: ProjectNote[];
  changeHistory?: { date: string; change: string }[];
  isUrgent?: boolean;
  color?: string;
  order?: number;
  alerts?: ProjectAlerts;
}

export type TaskStatus = 'pendiente' | 'para-soldar' | 'montada' | 'finalizada' | 'en-progreso';
export type TaskComponent = 'Estructura' | 'Cableado' | 'Programación' | 'Ensamblaje' | 'Diseño' | 'Corte' | 'Soldadura' | 'Montaje' | 'Pruebas';
export type TaskPriority = 'Baja' | 'Media' | 'Alta';

export interface Signature {
  userId: string;
  date: string; // ISO date string
}

export interface TaskComment {
    id: string;
    authorId: string;
    date: string; // ISO date string
    content: string;
    isClosed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  partId: string;
  component: TaskComponent;
  status: TaskStatus;
  assignedToId: string;
  estimatedTime: number; // in hours
  actualTime: number; // in hours
  finalizedByUserId?: string;
  finalizedAt?: string; // ISO date string
  signatureHistory?: Signature[];
  comments?: TaskComment[];
  attachmentURL?: string;
  attachmentName?: string;
  priority: TaskPriority;
  deadline: string; // ISO date string
  progress: number; // 0-100
  isUrgent?: boolean;
  blocked?: boolean;
}

export interface CommonTask {
    id: string;
    title: string;
    description: string;
    estimatedTime: number;
}

export interface DailySummary {
    summary: string;
}
