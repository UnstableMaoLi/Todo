export type TodoFilter = 'all' | 'active' | 'done';

export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

export interface UiState {
  filter: TodoFilter;
}

export interface ViewModel {
  allTodos: TodoItem[];
  visibleTodos: TodoItem[];
  ui: UiState;
}

export type TodoAction =
  | { kind: 'toggle'; id: number }
  | { kind: 'delete'; id: number }
  | { kind: 'edit'; id: number; text: string };
