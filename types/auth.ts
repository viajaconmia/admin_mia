export type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type Role = {
  role_id: number;
  role_name: string;
};
export type Permission = {
  id: number;
  name: string;
  description: string;
  active?: boolean;
  categoria: "funcionalidad" | "vista";
};
