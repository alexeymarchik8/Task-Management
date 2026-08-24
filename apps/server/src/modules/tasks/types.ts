export interface CreateTaskBody {
  title?: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
}

export interface UpdateTaskBody {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
}
