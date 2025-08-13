// This file is machine-generated - edit with caution!
/**
 * @fileOverview Type definitions for the engineer report generation flow.
 *
 * - EngineerReportInput - The input type for the generateEngineerReport function.
 * - EngineerReportOutput - The return type for the generateEngineerReport function.
 */

import {z} from 'genkit';

const TaskStatsSchema = z.object({
  status: z.string().describe('El estado de la tarea (ej: Finalizadas, Montadas).'),
  quantity: z.number().describe('La cantidad de tareas en ese estado.'),
  percentage: z
    .string()
    .describe(
      "El porcentaje completado para ese grupo de tareas (ej: '25%'). Puede ser '--' si no aplica."
    ),
});

export const EngineerReportInputSchema = z.object({
  engineerName: z
    .string()
    .describe('Nombre del ingeniero para quien se genera el informe.'),
  activeProjects: z
    .array(z.string())
    .describe('Lista de nombres de proyectos activos para el ingeniero.'),
  taskStats: z
    .array(TaskStatsSchema)
    .describe('Estadísticas de tareas agrupadas por estado.'),
  personalProgress: z.number().describe('Porcentaje de progreso personal.'),
  delayedTasksAlerts: z
    .array(z.string())
    .describe('Alertas para tareas retrasadas o riesgos.'),
  observations: z
    .array(z.string())
    .describe('Observaciones o prioridades clave.'),
});
export type EngineerReportInput = z.infer<typeof EngineerReportInputSchema>;

export const EngineerReportOutputSchema = z.object({
  report: z
    .string()
    .describe(
      'El informe de resumen generado para el ingeniero en formato de texto plano estructurado.'
    ),
});
export type EngineerReportOutput = z.infer<typeof EngineerReportOutputSchema>;
