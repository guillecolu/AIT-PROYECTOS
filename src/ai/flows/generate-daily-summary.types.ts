// This file is machine-generated - edit with caution!
/**
 * @fileOverview Type definitions for the daily summary generation flow.
 *
 * - DailySummaryInput - The input type for the generateDailySummary function.
 * - DailySummaryOutput - The return type for the generateDailySummary function.
 */

import {z} from 'genkit';

export const DailySummaryInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  tasks: z
    .array(
      z.object({
        title: z.string(),
        status: z.string(),
        deadline: z.string().describe('Deadline in ISO format.'),
        assignedToName: z.string(),
        priority: z.string(),
      })
    )
    .describe('A list of pending tasks for the project.'),
});
export type DailySummaryInput = z.infer<typeof DailySummaryInputSchema>;

export const DailySummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'The generated daily summary in a structured, plain text format, using Markdown for lists.'
    ),
});
export type DailySummaryOutput = z.infer<typeof DailySummaryOutputSchema>;
