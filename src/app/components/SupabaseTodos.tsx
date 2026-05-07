import { useEffect, useState } from "react";
import { CircleAlert, Cloud, LoaderCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Todo = {
  id: string | number;
  name: string;
};

export function SupabaseTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadTodos() {
      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from("todos")
          .select("id, name")
          .limit(5);

        if (queryError) throw queryError;

        if (!ignore) {
          setTodos(data ?? []);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Unable to load todos from Supabase.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadTodos();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Cloud size={16} />
        </div>
        <div>
          <h3 className="text-gray-900">Supabase Todos</h3>
          <p className="text-xs text-gray-500">Live sample query from the `todos` table</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LoaderCircle size={14} className="animate-spin" />
          Loading todos...
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
          <CircleAlert size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : todos.length === 0 ? (
        <p className="text-sm text-gray-500">Connected successfully, but no todos were returned.</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="text-sm text-gray-700 border border-gray-100 rounded-lg px-3 py-2 bg-gray-50"
            >
              {todo.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
