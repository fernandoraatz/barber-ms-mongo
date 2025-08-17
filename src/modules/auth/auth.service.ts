import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
//import { UserService } from "../user/user.service"; // injete o módulo de user
import { SignupDto } from "./models/signup.dto";
import { LoginDto } from "./models/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userService.create({
      ...dto,
      password: hashedPassword,
    });

    return this.generateToken(user);
  }

  async validateGoogleLogin(profile: any) {
    let user = await this.userService.findByEmail(profile.email);

    if (!user) {
      user = await this.userService.create({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        password: null, // opcional
        role: "CLIENT", // padrão
      });
    }

    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException("Usuário não encontrado");

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException("Senha incorreta");

    return this.generateToken(user);
  }

  async generateToken(user: unknown) {
    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
