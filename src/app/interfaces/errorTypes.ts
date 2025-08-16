export interface TErrorSources {
  path: string;
  message: string;
}
export interface TGenericErrorResoponse {
  statusCode: number;
  message: string;
  errorSources ?: TErrorSources[]
}