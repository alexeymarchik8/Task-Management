export interface JoinProjectBody {
  code?: string;
}

export interface JoinRequestResponse {
  id: string;
  userId: string;
  projectId: string;
  status: string;
}
