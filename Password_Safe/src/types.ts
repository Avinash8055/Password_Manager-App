export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  entries: PasswordEntry[];
}

export interface AppState {
  masterPassword: string;
  folders: Folder[];
}