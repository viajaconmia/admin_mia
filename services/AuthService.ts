import { User } from "@/context/AuthContext";
import { ApiResponse, ApiService } from "./ApiService";

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

  public verifySession = async (): Promise<ApiResponse<User | null>> =>
    this.get<User | null>({
      path: this.formatPath(this.ENDPOINTS.AUTH.GET.VERIFY_SESSION),
    });

  public logIn = async ({
    password,
    email,
  }: {
    password: string;
    email: string;
  }): Promise<ApiResponse<User>> =>
    this.post<User>({
      path: this.formatPath(this.ENDPOINTS.AUTH.POST.LOGIN),
      body: { password, email },
    });
}
