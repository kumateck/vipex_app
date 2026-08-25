export type UserPasswordTarget = {
  id: string;
  fullname: string;
  email: string;
  roleName: string | null;
  branchName: string | null;
};

export type SetUserPasswordInput = {
  userId: string;
  password: string;
};
