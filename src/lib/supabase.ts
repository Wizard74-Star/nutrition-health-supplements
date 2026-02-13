import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://nlkfbstnuyyaadlppzuc.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImViN2QxOTJiLTkzNWItNGNiMy05ODBmLWYwZGJjZGE1M2I4NyJ9.eyJwcm9qZWN0SWQiOiJubGtmYnN0bnV5eWFhZGxwcHp1YyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzcwNzE2MjkxLCJleHAiOjIwODYwNzYyOTEsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.X1q1OwujFsx6N1YWP1RhdMMuD8r7w58tOOykJimJC4E';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Safely invoke a Supabase edge function.
 * Catches JSON parse errors when the server returns HTML (e.g., 404) instead of JSON.
 */
export async function safeInvoke(
  functionName: string,
  options?: { body?: Record<string, unknown> }
): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, options);
    return { data, error };
  } catch (err: any) {
    // This catches JSON parse errors like "Unexpected token '<'"
    // which happen when the edge function endpoint returns HTML instead of JSON
    console.warn(`Edge function "${functionName}" unavailable:`, err?.message);
    return {
      data: null,
      error: { message: `Edge function "${functionName}" is not available. ${err?.message || ''}` },
    };
  }
}

export { supabase };
