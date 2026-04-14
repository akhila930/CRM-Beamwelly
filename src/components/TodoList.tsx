'use client';

import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoList = ({ todos, onToggle, onDelete }: TodoListProps) => {
  return (
    <Paper elevation={2} sx={{ maxHeight: '60vh', overflow: 'auto' }}>
      <List>
        {todos.map((todo) => (
          <ListItem
            key={todo.id}
            sx={{
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
              '&:last-child': {
                borderBottom: 'none',
              },
            }}
          >
            <IconButton
              edge="start"
              onClick={() => onToggle(todo.id)}
              sx={{ mr: 1, color: todo.completed ? 'success.main' : 'action.disabled' }}
            >
              {todo.completed ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
            </IconButton>
            <ListItemText
              primary={todo.text}
              sx={{
                textDecoration: todo.completed ? 'line-through' : 'none',
                color: todo.completed ? 'text.secondary' : 'text.primary',
              }}
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={() => onDelete(todo.id)} color="error">
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default TodoList; 