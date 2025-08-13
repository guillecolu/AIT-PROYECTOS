'use server';
/**
 * @fileOverview Generates a comprehensive summary report for a given project for a meeting.
 *
 * - generateProjectReport - A function that generates a project report.
 */

import {ai} from '@/ai/genkit';
import {
  GenerateProjectReportInputSchema,
  GenerateProjectReportOutputSchema,
  type GenerateProjectReportInput,
  type GenerateProjectReportOutput,
} from './generate-project-report.types';


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
