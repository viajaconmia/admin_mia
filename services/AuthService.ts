import { UserLoggin } from "@/context/AuthContext";
import { ApiResponse, ApiService } from "./ApiService";
import { Permission, Role, User } from "@/types/auth";

export class AuthService extends ApiService {
  private ENDPOINTS = {
    AUTH: {
      POST: {
        SIGNUP: "/auth/signup",
        LOGIN: "/auth/login",
        LOGOUT: "/auth/logout",
      },
      GET: {
        VERIFY_SESSION: "/auth/verify-session",
        GET_USERS: "/auth/usuarios",
        GET_PERMISOS: "/auth/permisos",
      },
    },
    USER: {
      GET: {
        ROLES: "/user/roles",
      },
      PATCH: {
        UPDATE_ACTIVE: "/user/active",
        UPDATE_PERMISSION: "/user/permission",
        UPDATE_ROLE: "/user/role",
      },
    },
    ROLES: {
      POST: {
        CREAR: "/auth/role",
      },
    },
  };

  private static instance: AuthService;

  private constructor() {
    super("/admin");
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new AuthService();
    }
    return this.instance;
  }

  public signUp = async ({
    username,
    password,
    email,
    role,
  }: {
    username: string;
    password: string;
    email: string;
    role: { id: number; name: string };
  }): Promise<ApiResponse<null>> =>
    this.post<null>({
      path: this.formatPath(this.ENDPOINTS.AUTH.POST.SIGNUP),
      body: { username, password, email, role },
    });

  public logOut = async (): Promise<ApiResponse<null>> =>
    this.post<null>({ path: this.formatPath(this.ENDPOINTS.AUTH.POST.LOGOUT) });

  public verifySession = async (): Promise<ApiResponse<UserLoggin | null>> =>
    this.get<UserLoggin | null>({
      path: this.formatPath(this.ENDPOINTS.AUTH.GET.VERIFY_SESSION),
    });

  public getUsers = async (): Promise<
    ApiResponse<
      (User & Role & { permissions_extra: number; active: boolean })[]
    >
  > =>
    this.get<(User & Role & { permissions_extra: number; active: boolean })[]>({
      path: this.formatPath(this.ENDPOINTS.AUTH.GET.GET_USERS),
    });

  public getPermisos = async (
    id?: string
  ): Promise<ApiResponse<Permission[]>> =>
    this.get<Permission[]>({
      path: this.formatPath(this.ENDPOINTS.AUTH.GET.GET_PERMISOS),
      params: { id },
    });

  public logIn = async ({
    password,
    email,
  }: {
    password: string;
    email: string;
  }): Promise<ApiResponse<UserLoggin>> =>
    this.post<UserLoggin>({
      path: this.formatPath(this.ENDPOINTS.AUTH.POST.LOGIN),
      body: { password, email },
    });

  public updateActiveUser = async (id: string, value: boolean) =>
    this.patch({
      body: { id, value },
      path: this.formatPath(this.ENDPOINTS.USER.PATCH.UPDATE_ACTIVE),
    });

  public updateUserPermission = async (
    id_permission: number,
    id_user: string,
    value: boolean
  ) =>
    this.patch({
      body: { id_permission, id_user, value },
      path: this.formatPath(this.ENDPOINTS.USER.PATCH.UPDATE_PERMISSION),
    });

  public updateUserRole = async (id_role: number, id_user: string) =>
    this.patch({
      body: { id_role, id_user },
      path: this.formatPath(this.ENDPOINTS.USER.PATCH.UPDATE_ROLE),
    });

  public getRoles = async (): Promise<ApiResponse<Role[]>> =>
    this.get<Role[]>({ path: this.formatPath(this.ENDPOINTS.USER.GET.ROLES) });

  public crearRole = async (name: string) =>
    this.post({
      path: this.formatPath(this.ENDPOINTS.ROLES.POST.CREAR),
      body: { name },
    });
}
