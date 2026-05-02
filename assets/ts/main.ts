import type { TodoAction, TodoFilter, TodoItem, UiState, ViewModel } from './types';

declare const rxjs: any;

const { BehaviorSubject, combineLatest, fromEvent } = rxjs;
const { map, filter } = rxjs.operators;

const todoForm = document.querySelector<HTMLFormElement>('#todoForm')!;
const todoInput = document.querySelector<HTMLInputElement>('#todoInput')!;
const filterSelect = document.querySelector<HTMLSelectElement>('#filterSelect')!;
const todoList = document.querySelector<HTMLUListElement>('#todoList')!;
const counter = document.querySelector<HTMLParagraphElement>('#counter')!;

const todos$ = new BehaviorSubject<TodoItem[]>([
  { id: 1, text: 'Вивчити BehaviorSubject', completed: false },
  { id: 2, text: 'Реалізувати fromEvent', completed: true },
  { id: 3, text: 'Підключити combineLatest', completed: false },
]);

const uiState$ = new BehaviorSubject<UiState>({
  filter: 'all',
});

const addTodo$ = fromEvent(todoForm, 'submit').pipe(
  map((event: SubmitEvent) => {
    event.preventDefault();
    return todoInput.value.trim();
  }),
  filter((text: string) => text.length > 0)
);

addTodo$.subscribe((text: string) => {
  const newTodo: TodoItem = {
    id: Date.now(),
    text,
    completed: false,
  };

  todos$.next([...todos$.value, newTodo]);
  todoInput.value = '';
});

const filterChange$ = fromEvent(filterSelect, 'change').pipe(
  map((event: Event) => {
    const select = event.target as HTMLSelectElement;
    return select.value as TodoFilter;
  })
);

filterChange$.subscribe((selectedFilter: TodoFilter) => {
  uiState$.next({ filter: selectedFilter });
});

const todoAction$ = fromEvent(todoList, 'click').pipe(
  map((event: MouseEvent): TodoAction | null => {
    const target = event.target as HTMLElement;
    const row = target.closest<HTMLLIElement>('li[data-id]');

    if (!row) {
      return null;
    }

    const id = Number(row.dataset.id);

    if (target.classList.contains('toggle')) {
      return { kind: 'toggle', id };
    }

    if (target.classList.contains('delete')) {
      return { kind: 'delete', id };
    }

    if (target.classList.contains('edit')) {
      const currentTodo = todos$.value.find((todo: TodoItem) => todo.id === id);

      if (!currentTodo) {
        return null;
      }

      const newText = prompt('Введіть новий текст завдання:', currentTodo.text);

      if (!newText || newText.trim().length === 0) {
        return null;
      }

      return {
        kind: 'edit',
        id,
        text: newText.trim(),
      };
    }

    return null;
  }),
  filter((action: TodoAction | null): action is TodoAction => action !== null)
);

todoAction$.subscribe((action: TodoAction) => {
  const currentTodos: TodoItem[] = todos$.value;

  if (action.kind === 'toggle') {
    const updatedTodos = currentTodos.map((todo) =>
      todo.id === action.id
        ? { ...todo, completed: !todo.completed }
        : todo
    );

    todos$.next(updatedTodos);
  }

  if (action.kind === 'delete') {
    const updatedTodos = currentTodos.filter((todo) => todo.id !== action.id);
    todos$.next(updatedTodos);
  }

  if (action.kind === 'edit') {
    const updatedTodos = currentTodos.map((todo) =>
      todo.id === action.id
        ? { ...todo, text: action.text }
        : todo
    );

    todos$.next(updatedTodos);
  }
});

const viewModel$ = combineLatest([todos$, uiState$]).pipe(
  map(([todos, ui]: [TodoItem[], UiState]): ViewModel => {
    let visibleTodos: TodoItem[];

    if (ui.filter === 'active') {
      visibleTodos = todos.filter((todo) => !todo.completed);
    } else if (ui.filter === 'done') {
      visibleTodos = todos.filter((todo) => todo.completed);
    } else {
      visibleTodos = todos;
    }

    return {
      allTodos: todos,
      visibleTodos,
      ui,
    };
  })
);

viewModel$.subscribe(render);

function render(viewModel: ViewModel): void {
  todoList.innerHTML = '';

  viewModel.visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.dataset.id = String(todo.id);
    item.className = todo.completed ? 'todo done' : 'todo';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.className = 'toggle';

    const text = document.createElement('span');
    text.textContent = todo.text;
    text.className = 'todo-text';

    const editButton = document.createElement('button');
    editButton.textContent = 'Редагувати';
    editButton.className = 'edit';

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Видалити';
    deleteButton.className = 'delete';

    item.append(checkbox, text, editButton, deleteButton);
    todoList.append(item);
  });

  const total = viewModel.allTodos.length;
  const done = viewModel.allTodos.filter((todo) => todo.completed).length;
  const active = total - done;

  counter.textContent =
    `Усього: ${total} | Виконано: ${done} | Активно: ${active} | ` +
    `Показано на екрані: ${viewModel.visibleTodos.length}`;
}
