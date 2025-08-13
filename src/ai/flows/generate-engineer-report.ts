'use server';
// This file is machine-generated - edit with caution!

/**
 * @fileOverview A flow to generate a summary report for each engineer, detailing their active projects,
 * task statuses, personal progress, and alerts for delayed tasks.
 *
 * - generateEngineerReport - Generates the engineer report.
 */

import {ai} from '@/ai/genkit';
import {
  EngineerReportInputSchema,
  EngineerReportOutputSchema,
  type EngineerReportInput,
  type EngineerReportOutput,
} from './generate-engineer-report.types';

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
