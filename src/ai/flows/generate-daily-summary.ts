'use server';

/**
 * @fileOverview A flow to generate a daily summary and task prioritization for a project.
 *
 * - generateDailySummary - Generates the daily summary report.
 */

import {ai} from '@/ai/genkit';
import {
  DailySummaryInputSchema,
  DailySummaryOutputSchema,
  type DailySummaryInput,
  type DailySummaryOutput,
} from './generate-daily-summary.types';


export async function generateDailySummary(input: DailySummaryInput): Promise<DailySummaryOutput> {
  return generateDailySummaryFlow(input);
}

const dailySummaryPrompt = ai.definePrompt({
  name: 'dailySummaryPrompt',
  input: {schema: DailySummaryInputSchema},
  output: {schema: DailySummaryOutputSchema},
  prompt: `Eres un asistente de jefe de proyecto experto en la industria del metal. Tu objetivo es generar un resumen diario claro, profesional y accionable para el proyecto "{{projectName}}". El formato debe ser texto plano, sin asteriscos ni caracteres de formato Markdown.

Analiza la siguiente lista de tareas pendientes. La fecha de hoy es {{currentDate}}.

{{#each tasks}}
- Tarea: "{{title}}" (Prioridad: {{priority}}) asignada a {{assignedToName}}. Vence el {{deadline}}. Estado: {{status}}.
{{/each}}

Basado en estos datos, crea un resumen que siga ESTRICTAMENTE el siguiente formato. No añadas símbolos, guiones o cualquier otro formato que no esté especificado aquí.

Resumen Diario – {{projectName}}
Fecha: {{currentDate}}

Prioridades Clave para Hoy:
{{{keyPriorities}}}

Tareas con Plazo Cercano (Próximos 3 días):
{{{upcomingDeadlines}}}

Recomendación del Día:
{{{recommendation}}}

**Instrucciones para generar el contenido de cada sección**:
1.  **keyPriorities**: Identifica 2-3 tareas críticas. Usa un formato numérico (1., 2., 3.). Describe la tarea, el responsable y los días restantes. Ejemplo: "1. Diseñar el soporte principal – (Juan Pérez) – Vence en 2 días". Si no hay, responde "Ninguna por el momento.".
2.  **upcomingDeadlines**: Lista tareas que vencen en los próximos 3 días. Usa un guion (-) para cada una. Ejemplo: "- Montar el panel eléctrico – (Carlos López) – Vence mañana". Si no hay, responde "Ninguna por el momento.".
3.  **recommendation**: Ofrece una recomendación breve y directa sobre el enfoque del día. Ejemplo: "Asegurar que las tareas con vencimiento próximo se completen hoy para evitar retrasos en cascada.". Si no hay una recomendación clara, responde "Mantener el buen ritmo y comunicar cualquier bloqueo.".

El resultado debe ser un texto coherente y legible con saltos de línea claros entre secciones.
`,
});

const generateDailySummaryFlow = ai.defineFlow(
  {
    name: 'generateDailySummaryFlow',
    inputSchema: DailySummaryInputSchema,
    outputSchema: DailySummaryOutputSchema,
  },
  async (input) => {
    const currentDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const {output} = await dailySummaryPrompt({...input, currentDate});
    return output!;
  }
);
