import {
  ApiError,
  WithKeyPair,
  apiTxExecMutationFn,
} from "@shinami/nextjs-zklogin/client";
import {
  UseMutationResult,
  useMutation,
} from "@tanstack/react-query";
import {
  RegisterAoRRequest,
  RegisterAoRResponse,
  CreateCompanyRequest,
  CreateCompanyResponse,
} from "../shared/interfaces";

/**
 * Mutation pour enregistrer un AoR dans le registre global
 */
export function useRegisterAoRMutation(): UseMutationResult<
  RegisterAoRResponse,
  ApiError,
  RegisterAoRRequest & WithKeyPair
> {
  return useMutation({
    mutationFn: apiTxExecMutationFn({
      baseUri: () => "/api/register-aor",
      body: ({ keyPair, ...req }) => req,
      resultSchema: RegisterAoRResponse,
    }),
  });
}

/**
 * Mutation pour créer une entreprise
 */
export function useCreateCompanyMutation(): UseMutationResult<
  CreateCompanyResponse,
  ApiError,
  CreateCompanyRequest & WithKeyPair
> {
  return useMutation({
    mutationFn: apiTxExecMutationFn({
      baseUri: () => "/api/create-company",
      body: ({ keyPair, ...req }) => req,
      resultSchema: CreateCompanyResponse,
    }),
  });
}

