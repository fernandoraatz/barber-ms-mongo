export const jwtConstants = {
  secret: process.env.JWT_SECRET || "secret-key",
  expiresIn: "1h",
};
