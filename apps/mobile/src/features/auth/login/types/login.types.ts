export type LoginFormValues = {
  email: string;
  password: string;
};

export type LoginFormProps = LoginFormValues & {
  error: string | null;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
};
