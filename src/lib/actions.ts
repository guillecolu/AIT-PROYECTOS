"use server";

import { redirect } from 'next/navigation';

export async function signIn() {
  // In a real app, you'd validate credentials with Firebase Auth
  await new Promise(resolve => setTimeout(resolve, 1000));
  redirect('/dashboard');
}
