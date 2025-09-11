import { User } from "@/context/AuthContext";
import { ApiResponse, ApiService } from "./ApiService";

export class AuthService extends ApiService {
  private ENDPOINTS = {
    POST: {
      SIGNUP: "/signup",
      LOGIN: "/login",
      LOGOUT: "/logout",
    },
    GET: {
      VERIFY_SESSION: "/verify-session",
    },
  };
  private static instance: AuthService;

  private constructor() {
    super("/admin/auth");
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
      path: this.formatPath(this.ENDPOINTS.POST.SIGNUP),
      body: { username, password, email, role },
    });

  public logOut = async (): Promise<ApiResponse<null>> =>
    this.post<null>({ path: this.formatPath(this.ENDPOINTS.POST.LOGOUT) });

  public verifySession = async (): Promise<ApiResponse<User | null>> =>
    this.get<User | null>({
      path: this.formatPath(this.ENDPOINTS.GET.VERIFY_SESSION),
    });

  public logIn = async ({
    password,
    email,
  }: {
    password: string;
    email: string;
  }): Promise<ApiResponse<User>> =>
    this.post<User>({
      path: this.formatPath(this.ENDPOINTS.POST.LOGIN),
      body: { password, email },
    });
}
