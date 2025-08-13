
/**
 * @fileOverview Generates a comprehensive summary report for a given project for a meeting.
 *
 * - generateProjectReport - A function that generates a project report.
 * - GenerateProjectReportInput - The input type for the generateProjectReport function.
 * - GenerateProjectReportOutput - The return type for the generateProjectReport function.
 */

import {ai} from '@/ai/genkit';
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

const GenerateProjectReportInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  totalProgress: z.number().describe('The total progress of the project (%).'),
  assignedPeople: z.array(z.string()).describe('The names of the people assigned to the project.'),
  overallStatus: z.string().describe('The overall status of the project (on time / delayed / paused).'),
  etapas: z.array(StageSchema).describe('The different areas or milestones of the project.'),
  tasks: z.array(TaskSchema).describe('A list of tasks associated with the project.'),
  deliveryDate: z.string().describe('The final delivery date for the project.'),
  notes: z.string().optional().describe('Additional text notes about the project.'),
});
export type GenerateProjectReportInput = z.infer<typeof GenerateProjectReportInputSchema>;

const GenerateProjectReportOutputSchema = z.object({
  executiveSummary: z.string().describe("Un resumen global del estado del proyecto, progreso y fechas clave."),
  risksAndBlockers: z.array(z.string()).describe("Una lista de riesgos, retrasos o bloqueos identificados."),
  overloadedEngineers: z.array(z.string()).describe("Una lista de ingenieros que podrían estar sobrecargados de tareas."),
  keyStats: z.object({
    completedTasks: z.string().describe("Estadística de tareas completadas vs totales (ej: '15/30')."),
    deliverablesFinished: z.string().describe("Estadística de entregables finalizados vs totales (ej: '2/5')."),
    tasksInProgress: z.string().describe("Estadística de tareas actualmente en progreso."),
  }),
});
export type GenerateProjectReportOutput = z.infer<typeof GenerateProjectReportOutputSchema>;

export async function generateProjectReport(input: GenerateProjectReportInput): Promise<GenerateProjectReportOutput> {
  return generateProjectReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProjectReportPrompt',
  input: {schema: GenerateProjectReportInputSchema},
  output: {schema: GenerateProjectReportOutputSchema},
  prompt: `Eres un asistente de Dirección de Proyectos de clase mundial. Tu rol es analizar datos de proyectos y proporcionar un resumen claro, conciso y accionable para una reunión de equipo.

  Analiza los siguientes datos del proyecto "{{projectName}}":

  - Estado General: {{overallStatus}} ({{totalProgress}}% completado)
  - Fecha Final de Entrega: {{deliveryDate}}
  - Ingenieros Asignados: {{#each assignedPeople}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  - Áreas (Entregables):
  {{#each etapas}}
    - {{nombre}}: {{estado}} ({{porcentaje}}% completado)
  {{/each}}

  - Tareas:
  {{#each tasks}}
    - "{{title}}" está {{status}} y asignada a {{assignedToName}}.
  {{/each}}

  {{#if notes}}
  - Notas Adicionales:
  {{{notes}}}
  {{/if}}

  Basado en estos datos, proporciona lo siguiente en español:

  1.  **executiveSummary**: Escribe un resumen global de 2-3 frases. Comienza con el nombre del proyecto y su estado general. Menciona el progreso clave y la próxima fecha importante.
  2.  **keyStats**: Proporciona estadísticas clave. Cuenta el número de tareas completadas frente al total de tareas, y los entregables finalizados (Áreas al 100%) frente al total de entregables.
  3.  **risksAndBlockers**: Identifica y lista cualquier riesgo o bloqueo potencial. Ejemplos:
      - Áreas que están "en_proceso" pero tienen un bajo porcentaje de progreso.
      - Una fecha de entrega muy cercana pero con bajo progreso.
      - Tareas "pendientes" en un Área que ya está "en_proceso".
      - Cualquier información crítica mencionada en las notas.
  4.  **overloadedEngineers**: Identifica a los ingenieros que tienen asignadas un gran número de tareas "en-progreso" o "pendientes" en comparación con otros. Lista sus nombres.

  Tu objetivo es dar al equipo una instantánea clara y basada en datos para facilitar una reunión productiva. Sé factual y directo. El resultado debe ser exclusivamente en español.`,
});

const generateProjectReportFlow = ai.defineFlow(
  {
    name: 'generateProjectReportFlow',
    inputSchema: GenerateProjectReportInputSchema,
    outputSchema: GenerateProjectReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
