// This file is machine-generated - edit with caution!
/**
 * @fileOverview Type definitions for the task generation from prompt flow.
 *
 * - GenerateTasksInput - The input type for the generateTasksFromPrompt function.
 * - GenerateTasksOutput - The return type for the generateTasksFromPrompt function.
 */

import {z} from 'genkit';

const TaskSchema = z.object({
  title: z.string().describe('El nombre o título de la tarea a realizar.'),
  assignedToName: z
    .string()
    .optional()
    .describe('El nombre de la persona a la que se le asignó la tarea.'),
});

export const GenerateTasksOutputSchema = z.array(
  z.object({
    partName: z
      .string()
      .describe(
        "El nombre del Área o sección al que pertenecen las tareas (ej: 'Diseño', 'Montaje', 'Soldadura')."
      ),
    tasks: z.array(TaskSchema).describe('La lista de tareas para esa Área.'),
  })
);

export type GenerateTasksOutput = z.infer<typeof GenerateTasksOutputSchema>;

export const GenerateTasksInputSchema = z.object({
  prompt: z
    .string()
    .describe('La instrucción en lenguaje natural para generar las tareas.'),
  users: z
    .array(z.object({id: z.string(), name: z.string()}))
    .describe('La lista de usuarios disponibles para asignar tareas.'),
  projectId: z.string(),
  projectName: z.string(),
});
export type GenerateTasksInput = z.infer<typeof GenerateTasksInputSchema>;
