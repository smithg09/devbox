declare module "lesspass" {
  // Minimal type surface we use
  export interface LessPassOptions {
    site: string;
    login: string;
    length: number;
    counter: number;
    lowercase: boolean;
    uppercase: boolean;
    digits: boolean;
    symbols: boolean;
  }
  export function generatePassword(
    options: LessPassOptions,
    masterPassword: string
  ): Promise<string> | string;
}
