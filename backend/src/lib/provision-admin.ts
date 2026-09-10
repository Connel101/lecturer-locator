export interface AdminProvisioningInput {
  email: string;
  password: string;
  name?: string;
}

export interface ProvisionedUser {
  role: string | null | undefined;
}

export interface AdminProvisioningDependencies {
  findUserByEmail: (email: string) => Promise<ProvisionedUser | undefined>;
  createUser: (user: {
    email: string;
    password: string;
    name: string;
    role: "admin";
  }) => Promise<unknown>;
}

export type AdminProvisioningResult = "created" | "already-admin";

export async function provisionAdmin(
  input: AdminProvisioningInput,
  dependencies: AdminProvisioningDependencies,
): Promise<AdminProvisioningResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() || "Admin";

  if (!email) {
    throw new Error("ADMIN_EMAIL is required.");
  }

  if (input.password.length < 8) {
    throw new Error("ADMIN_PASSWORD must contain at least 8 characters.");
  }

  const existingUser = await dependencies.findUserByEmail(email);

  if (existingUser) {
    const roles = existingUser.role?.split(",").map((role) => role.trim());

    if (roles?.includes("admin")) {
      return "already-admin";
    }

    throw new Error(
      `A non-administrator account already exists for ${email}. Refusing to change it automatically.`,
    );
  }

  await dependencies.createUser({
    email,
    password: input.password,
    name,
    role: "admin",
  });

  return "created";
}
