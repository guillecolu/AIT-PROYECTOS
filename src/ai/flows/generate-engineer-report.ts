// This file is machine-generated - edit with caution!

/**
 * @fileOverview A flow to generate a summary report for each engineer, detailing their active projects,
 * task statuses, personal progress, and alerts for delayed tasks.
 *
 * - generateEngineerReport - Generates the engineer report.
 * - EngineerReportInput - The input type for the generateEngineerReport function.
 * - EngineerReportOutput - The return type for the generateEngineerReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskStatsSchema = z.object({
  status: z.string().describe('El estado de la tarea (ej: Finalizadas, Montadas).'),
  quantity: z.number().describe('La cantidad de tareas en ese estado.'),
  percentage: z.string().describe("El porcentaje completado para ese grupo de tareas (ej: '25%'). Puede ser '--' si no aplica."),
});

const EngineerReportInputSchema = z.object({
  engineerName: z.string().describe('Nombre del ingeniero para quien se genera el informe.'),
  activeProjects: z.array(z.string()).describe('Lista de nombres de proyectos activos para el ingeniero.'),
  taskStats: z.array(TaskStatsSchema).describe('Estadísticas de tareas agrupadas por estado.'),
  personalProgress: z.number().describe('Porcentaje de progreso personal.'),
  delayedTasksAlerts: z.array(z.string()).describe('Alertas para tareas retrasadas o riesgos.'),
  observations: z.array(z.string()).describe('Observaciones o prioridades clave.'),
});
export type EngineerReportInput = z.infer<typeof EngineerReportInputSchema>;

const EngineerReportOutputSchema = z.object({
  report: z.string().describe('El informe de resumen generado para el ingeniero en formato de texto plano estructurado.'),
});
export type EngineerReportOutput = z.infer<typeof EngineerReportOutputSchema>;

export async function generateEngineerReport(input: EngineerReportInput): Promise<EngineerReportOutput> {
  return generateEngineerReportFlow(input);
}

const engineerReportPrompt = ai.definePrompt({
  name: 'engineerReportPrompt',
  input: {schema: EngineerReportInputSchema},
  output: {schema: EngineerReportOutputSchema},
  prompt: `Genera un informe de ingeniero para "{{engineerName}}" con un formato de texto plano, visual y estructurado, ideal para una reunión. Usa los datos proporcionados. El informe DEBE ser conciso, usar frases cortas y accionables, y seguir este formato EXACTO:

👩‍🔧 Informe de Ingeniero – {{engineerName}}

📂 Proyectos Activos:
{{#each activeProjects}}
- {{{this}}}
{{/each}}

📊 Estado de Tareas:
| Estado         | Cantidad | % Completado |
|----------------|----------|--------------|
{{#each taskStats}}
| {{status}} | {{quantity}}       | {{percentage}}         |
{{/each}}

📈 Progreso Personal:
Genera una barra de progreso de texto con 10 caracteres (usando '█' para el progreso y '░' para lo que falta) y muestra el porcentaje. Añade un estado basado en el progreso (Rojo <40%, Amarillo 40-80%, Verde >80%).
Ejemplo: ███░░░░░░░ 30% (Rojo – bajo avance)

⚠ Riesgos / Prioridades:
{{#if delayedTasksAlerts}}
{{#each delayedTasksAlerts}}
- {{{this}}}
{{/each}}
{{else}}
- Sin riesgos significativos.
{{/if}}

📝 Observaciones Clave:
{{#if observations}}
{{#each observations}}
- {{{this}}}
{{/each}}
{{else}}
- Mantener el buen ritmo y comunicar cualquier bloqueo.
{{/if}}
`,
});

const generateEngineerReportFlow = ai.defineFlow(
  {
    name: 'generateEngineerReportFlow',
    inputSchema: EngineerReportInputSchema,
    outputSchema: EngineerReportOutputSchema,
  },
  async input => {
    const {output} = await engineerReportPrompt(input);
    return output!;
  }
);
