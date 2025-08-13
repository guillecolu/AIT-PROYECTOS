// This file is machine-generated - edit with caution!
/**
 * @fileOverview Type definitions for the project report generation flow.
 *
 * - GenerateProjectReportInput - The input type for the generateProjectReport function.
 * - GenerateProjectReportOutput - The return type for the generateProjectReport function.
 */
import {z} from 'genkit';

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  assignedToName: z.string(),
});

const StageSchema = z.object({
  nombre: z.string(),
  estado: z.string(),
  porcentaje: z.number(),
});

export const GenerateProjectReportInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  totalProgress: z.number().describe('The total progress of the project (%).'),
  assignedPeople: z
    .array(z.string())
    .describe('The names of the people assigned to the project.'),
  overallStatus: z
    .string()
    .describe('The overall status of the project (on time / delayed / paused).'),
  etapas: z
    .array(StageSchema)
    .describe('The different areas or milestones of the project.'),
  tasks: z
    .array(TaskSchema)
    .describe('A list of tasks associated with the project.'),
  deliveryDate: z.string().describe('The final delivery date for the project.'),
  notes: z.string().optional().describe('Additional text notes about the project.'),
});
export type GenerateProjectReportInput = z.infer<
  typeof GenerateProjectReportInputSchema
>;

export const GenerateProjectReportOutputSchema = z.object({
  executiveSummary: z
    .string()
    .describe('Un resumen global del estado del proyecto, progreso y fechas clave.'),
  risksAndBlockers: z
    .array(z.string())
    .describe('Una lista de riesgos, retrasos o bloqueos identificados.'),
  overloadedEngineers: z
    .array(z.string())
    .describe(
      'Una lista de ingenieros que podrían estar sobrecargados de tareas.'
    ),
  keyStats: z.object({
    completedTasks: z
      .string()
      .describe("Estadística de tareas completadas vs totales (ej: '15/30')."),
    deliverablesFinished: z
      .string()
      .describe(
        "Estadística de entregables finalizados vs totales (ej: '2/5')."
      ),
    tasksInProgress: z
      .string()
      .describe('Estadística de tareas actualmente en progreso.'),
  }),
});
export type GenerateProjectReportOutput = z.infer<
  typeof GenerateProjectReportOutputSchema
>;
