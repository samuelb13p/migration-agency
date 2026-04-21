export type ApiSuccess<T> = {
  data: T;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};
