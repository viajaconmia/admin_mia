import { UserLoggin } from "@/context/AuthContext";
import { ApiResponse, ApiService } from "./ApiService";
import { Role, User } from "@/types/auth";

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
}
