
/**
 * @fileOverview A flow to generate a list of tasks from a natural language prompt.
 * It identifies tasks, the person assigned, and the corresponding area.
 *
 * - generateTasksFromPrompt - Generates a structured list of tasks from a text prompt.
 * - GenerateTasksInput - The input type for the generateTasksFromPrompt function.
 * - GenerateTasksOutput - The return type for the generateTasksFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
  title: z.string().describe('El nombre o título de la tarea a realizar.'),
  assignedToName: z.string().optional().describe('El nombre de la persona a la que se le asignó la tarea.'),
});

const GenerateTasksOutputSchema = z.array(
    z.object({
        partName: z.string().describe("El nombre del Área o sección al que pertenecen las tareas (ej: 'Diseño', 'Montaje', 'Soldadura')."),
        tasks: z.array(TaskSchema).describe('La lista de tareas para esa Área.'),
    })
);

export type GenerateTasksOutput = z.infer<typeof GenerateTasksOutputSchema>;

const GenerateTasksInputSchema = z.object({
  prompt: z.string().describe('La instrucción en lenguaje natural para generar las tareas.'),
  users: z.array(z.object({id: z.string(), name: z.string()})).describe('La lista de usuarios disponibles para asignar tareas.'),
  projectId: z.string(),
  projectName: z.string(),
});
export type GenerateTasksInput = z.infer<typeof GenerateTasksInputSchema>;


export async function generateTasksFromPrompt(input: GenerateTasksInput): Promise<GenerateTasksOutput> {
  return generateTasksFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTasksFromPrompt',
  input: {schema: GenerateTasksInputSchema},
  output: {schema: GenerateTasksOutputSchema},
  prompt: `Eres un asistente experto en gestión de proyectos industriales. Tu tarea es analizar una instrucción de un jefe de proyecto y convertirla en una lista estructurada de tareas, asignando cada una al Área y persona correctos.

Contexto del Proyecto:
- Nombre: "{{projectName}}"
- ID: {{projectId}}

Lista de Personas Disponibles:
{{#each users}}
- {{name}} (ID: {{id}})
{{/each}}

Instrucción del Jefe de Proyecto:
"{{{prompt}}}"

Tu Misión:
Analiza la instrucción y extrae las tareas. Para cada tarea, identifica:
1.  A qué Área pertenece (Ej: Diseño, Montaje, Soldadura, Pruebas, etc.).
2.  La descripción específica de la tarea.
3.  A qué persona se le ha asignado. Si no se menciona a nadie, puedes dejarlo sin asignar.

Agrupa las tareas por el nombre del Área. Si en la instrucción se mencionan varios Áreas, crea un objeto para cada uno.

Ejemplo de resultado esperado si la instrucción fuera "Carla tiene que diseñar el soporte y Daniel debe encargarse del montaje":
[
  {
    "partName": "Diseño",
    "tasks": [
      { "title": "Diseñar el soporte", "assignedToName": "Carla" }
    ]
  },
  {
    "partName": "Montaje",
    "tasks": [
      { "title": "Montar el soporte", "assignedToName": "Daniel" }
    ]
  }
]

Devuelve solo el array JSON con la estructura solicitada. No incluyas comentarios ni texto adicional.`,
});

const generateTasksFromPromptFlow = ai.defineFlow(
  {
    name: 'generateTasksFromPromptFlow',
    inputSchema: GenerateTasksInputSchema,
    outputSchema: GenerateTasksOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
