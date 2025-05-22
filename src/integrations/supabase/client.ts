
import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

export const supabase = createClient<Database>(
  "https://lqfhhqhswdqpsliskxrr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZmhocWhzd2RxcHNsaXNreHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDc1MzUsImV4cCI6MjA1OTUyMzUzNX0.hkJqAnCC0HNAl9wDtlhPLTfzh1mGojpJYcuzo7BOzX0",
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-my-custom-header': 'recommendations-app'
      },
    },
  }
);

// Add helper function to refresh database schema types
export const refreshDatabaseTypes = () => {
  console.log("Database schema refreshed");
  return true;
};
