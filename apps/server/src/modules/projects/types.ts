export interface CreateProjectBody {
  name?: string;
}

export interface UpdateProjectBody {
  name?: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  code: string;
}
