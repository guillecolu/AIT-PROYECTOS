// This file is machine-generated - edit with caution!

/**
 * @fileOverview A flow to generate a daily summary and task prioritization for a project.
 *
 * - generateDailySummary - Generates the daily summary report.
 * - DailySummaryInput - The input type for the generateDailySummary function.
 * - DailySummaryOutput - The return type for the generateDailySummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const DailySummaryInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  tasks: z.array(z.object({
    title: z.string(),
    status: z.string(),
    deadline: z.string().describe('Deadline in ISO format.'),
    assignedToName: z.string(),
    priority: z.string(),
  })).describe('A list of pending tasks for the project.'),
});
export type DailySummaryInput = z.infer<typeof DailySummaryInputSchema>;

export const DailySummaryOutputSchema = z.object({
  summary: z.string().describe('The generated daily summary in a structured, plain text format, using Markdown for lists.'),
});
export type DailySummaryOutput = z.infer<typeof DailySummaryOutputSchema>;

export async function generateDailySummary(input: DailySummaryInput): Promise<DailySummaryOutput> {
  return generateDailySummaryFlow(input);
}

const dailySummaryPrompt = ai.definePrompt({
  name: 'dailySummaryPrompt',
  input: {schema: DailySummaryInputSchema},
  output: {schema: DailySummaryOutputSchema},
  prompt: `Eres un asistente de jefe de proyecto experto en la industria del metal. Tu objetivo es generar un resumen diario claro y accionable para el proyecto "{{projectName}}".

Analiza la siguiente lista de tareas pendientes. La fecha de hoy es {{currentDate}}.

{{#each tasks}}
- Tarea: "{{title}}" (Prioridad: {{priority}}) asignada a {{assignedToName}}. Vence el {{deadline}}. Estado: {{status}}.
{{/each}}

Basado en estos datos, crea un resumen que incluya:
1.  **Prioridades Clave para Hoy**: Identifica 2-3 tareas críticas que necesitan atención inmediata. Considera las fechas de vencimiento más próximas y las tareas con prioridad 'Alta'. Menciona el responsable y cuántos días quedan.
2.  **Vigilancia de Plazos**: Lista las tareas que vencen en los próximos 3 días.
3.  **Recomendación General**: Ofrece una recomendación breve sobre el enfoque del día, como "centrarse en desbloquear tareas pendientes" o "asegurar que las tareas de alta prioridad avancen".

Usa un formato de texto plano con listas (usando guiones). Sé directo y conciso.

Ejemplo de formato:

**Resumen Diario – {{projectName}}**

**Prioridades Clave para Hoy:**
- La tarea "Diseñar el soporte principal" (Juan Pérez) es crítica. Vence en 2 días.
- Avanzar en "Soldar la base" (Ana García), prioridad Alta.

**Vigilancia de Plazos (Próximos 3 días):**
- "Montar el panel eléctrico" (Carlos López) vence mañana.
- "Realizar pruebas iniciales" (Sofía Martín) vence en 3 días.

**Recomendación:**
Asegurar que las tareas con vencimiento próximo se completen hoy para evitar retrasos en cascada.
`,
});

const generateDailySummaryFlow = ai.defineFlow(
  {
    name: 'generateDailySummaryFlow',
    inputSchema: DailySummaryInputSchema,
    outputSchema: DailySummaryOutputSchema,
  },
  async (input) => {
    const currentDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const {output} = await dailySummaryPrompt({...input, currentDate});
    return output!;
  }
);
