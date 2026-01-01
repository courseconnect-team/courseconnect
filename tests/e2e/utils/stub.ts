import { Role } from './types';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

export const storageStateForRole = (role: Role) => ({
  cookies: [],
  origins: [
    {
      origin: baseURL,
      localStorage: [
        { name: 'e2e_role', value: role },
        { name: 'e2e_email', value: `${role}@example.com` },
        { name: 'e2e_name', value: `${role} user` },
      ],
    },
  ],
});
